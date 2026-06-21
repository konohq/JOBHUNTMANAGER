require "test_helper"

class ApplicationsTest < ActionDispatch::IntegrationTest
  test "all endpoints require authentication" do
    application = create_application(users(:one))

    requests = [
      -> { get "/api/v1/applications" },
      lambda {
        post "/api/v1/applications",
             params: {
               application: {
                 job_posting_id: application.job_posting_id,
                 applied_on: Date.current
               }
             },
             as: :json
      },
      -> { get "/api/v1/applications/#{application.id}" },
      lambda {
        patch "/api/v1/applications/#{application.id}",
              params: { application: { status: "offered" } },
              as: :json
      },
      -> { delete "/api/v1/applications/#{application.id}" }
    ]

    requests.each do |request|
      request.call
      assert_response :unauthorized
      assert_equal "unauthorized", response.parsed_body.dig("error", "code")
    end
  end

  test "index returns only current user applications in kanban order" do
    older_application = create_application(
      users(:one),
      title: "古い応募",
      status: :applied
    )
    newer_application = create_application(
      users(:one),
      title: "新しい応募",
      status: :applied
    )
    screening_application = create_application(
      users(:one),
      title: "書類選考中",
      status: :document_screening
    )
    create_application(users(:two), title: "他ユーザー応募")

    older_application.update_column(:updated_at, 2.days.ago)
    newer_application.update_column(:updated_at, 1.day.ago)

    get "/api/v1/applications",
        headers: authorization_headers(users(:one))

    assert_response :ok

    applications = response.parsed_body.fetch("data")
    assert_equal [
      newer_application.id,
      older_application.id,
      screening_application.id
    ], applications.pluck("id")
    assert_equal %w[applied applied document_screening],
                 applications.pluck("status")
    assert_equal "新しい応募",
                 applications.first.dig("job_posting", "title")
    assert_predicate applications.first.dig("job_posting", "company"), :present?
  end

  test "index preloads job posting and company without N plus one queries" do
    create_application(users(:one), title: "応募1")

    first_query_count = select_query_count do
      get "/api/v1/applications",
          headers: authorization_headers(users(:one))
    end

    create_application(users(:one), title: "応募2")
    create_application(users(:one), title: "応募3")

    multiple_query_count = select_query_count do
      get "/api/v1/applications",
          headers: authorization_headers(users(:one))
    end

    assert_equal first_query_count, multiple_query_count
  end

  test "show returns application details with related resources" do
    application = create_application(users(:one))
    interview = application.interviews.create!(
      interview_type: :first,
      scheduled_at: 1.week.from_now,
      status: :scheduled,
      result: :pending
    )
    task = application.tasks.create!(
      title: "履歴書を送付",
      priority: :high
    )
    note = application.notes.create!(body: "企業研究メモ")

    get "/api/v1/applications/#{application.id}",
        headers: authorization_headers(users(:one))

    assert_response :ok

    data = response.parsed_body.fetch("data")
    assert_equal application.id, data.fetch("id")
    assert_equal application.job_posting.source_url,
                 data.dig("job_posting", "source_url")
    assert_equal [ interview.id ], data.fetch("interviews").pluck("id")
    assert_equal [ task.id ], data.fetch("tasks").pluck("id")
    assert_equal [ note.id ], data.fetch("notes").pluck("id")
    assert_equal "企業研究メモ", data.fetch("notes").first.fetch("content")
    assert_not_includes data.fetch("notes").first, "body"
  end

  test "show returns not found for another user application" do
    application = create_application(users(:two))

    get "/api/v1/applications/#{application.id}",
        headers: authorization_headers(users(:one))

    assert_response :not_found
    assert_equal "not_found", response.parsed_body.dig("error", "code")
  end

  test "create associates application with current user and owned job posting" do
    job_posting = create_job_posting(users(:one), "応募対象求人")

    assert_difference("users(:one).applications.count", 1) do
      post "/api/v1/applications",
           params: {
             application: {
               job_posting_id: job_posting.id,
               status: "document_screening",
               applied_on: "2026-06-20",
               user_id: users(:two).id
             }
           },
           headers: authorization_headers(users(:one)),
           as: :json
    end

    assert_response :created

    data = response.parsed_body.fetch("data")
    application = Application.find(data.fetch("id"))
    assert_equal users(:one), application.user
    assert_equal job_posting, application.job_posting
    assert_equal "document_screening", application.status
    assert_equal "応募対象求人", data.dig("job_posting", "title")
    assert_not_includes data, "user_id"
  end

  test "create rejects another user job posting" do
    job_posting = create_job_posting(users(:two))

    assert_no_difference("Application.count") do
      post "/api/v1/applications",
           params: {
             application: {
               job_posting_id: job_posting.id,
               applied_on: Date.current
             }
           },
           headers: authorization_headers(users(:one)),
           as: :json
    end

    assert_response :not_found
    assert_equal "not_found", response.parsed_body.dig("error", "code")
  end

  test "create rejects duplicate application and invalid status" do
    application = create_application(users(:one))

    post "/api/v1/applications",
         params: {
           application: {
             job_posting_id: application.job_posting_id,
             applied_on: Date.current
           }
         },
         headers: authorization_headers(users(:one)),
         as: :json

    assert_response :unprocessable_entity
    assert_equal "validation_error",
                 response.parsed_body.dig("error", "code")

    job_posting = create_job_posting(users(:one), "ステータス不正求人")

    post "/api/v1/applications",
         params: {
           application: {
             job_posting_id: job_posting.id,
             status: "unknown",
             applied_on: Date.current
           }
         },
         headers: authorization_headers(users(:one)),
         as: :json

    assert_response :unprocessable_entity
    assert_predicate(
      response.parsed_body.dig("error", "details", "status"),
      :present?
    )
  end

  test "create returns validation error when database rejects duplicate" do
    job_posting = create_job_posting(users(:one), "DB重複制約求人")

    with_stubbed_instance_method(
      Application,
      :save,
      ->(*) { raise ActiveRecord::RecordNotUnique }
    ) do
      post "/api/v1/applications",
           params: {
             application: {
               job_posting_id: job_posting.id,
               applied_on: Date.current
             }
           },
           headers: authorization_headers(users(:one)),
           as: :json
    end

    assert_response :unprocessable_entity
    assert_equal "validation_error",
                 response.parsed_body.dig("error", "code")
    assert_predicate(
      response.parsed_body.dig("error", "details", "job_posting_id"),
      :present?
    )
  end

  test "create requires job posting and applied date" do
    post "/api/v1/applications",
         params: {
           application: {
             job_posting_id: nil,
             applied_on: nil
           }
         },
         headers: authorization_headers(users(:one)),
         as: :json

    assert_response :unprocessable_entity

    details = response.parsed_body.dig("error", "details")
    assert_predicate details["job_posting"], :present?
    assert_predicate details["applied_on"], :present?
  end

  test "update changes status and applied date" do
    application = create_application(users(:one))

    patch "/api/v1/applications/#{application.id}",
          params: {
            application: {
              status: "offered",
              applied_on: "2026-06-01"
            }
          },
          headers: authorization_headers(users(:one)),
          as: :json

    assert_response :ok

    application.reload
    assert_equal "offered", application.status
    assert_equal Date.new(2026, 6, 1), application.applied_on
    assert_equal "offered", response.parsed_body.dig("data", "status")
  end

  test "update does not allow job posting to be changed" do
    application = create_application(users(:one))
    other_job_posting = create_job_posting(users(:two))
    original_job_posting = application.job_posting

    patch "/api/v1/applications/#{application.id}",
          params: {
            application: {
              job_posting_id: other_job_posting.id,
              status: "offered"
            }
          },
          headers: authorization_headers(users(:one)),
          as: :json

    assert_response :ok
    assert_equal original_job_posting, application.reload.job_posting
    assert_equal "offered", application.status
  end

  test "update and destroy return not found for another user application" do
    application = create_application(users(:two))

    patch "/api/v1/applications/#{application.id}",
          params: { application: { status: "offered" } },
          headers: authorization_headers(users(:one)),
          as: :json

    assert_response :not_found
    assert_not_equal "offered", application.reload.status

    assert_no_difference("Application.count") do
      delete "/api/v1/applications/#{application.id}",
             headers: authorization_headers(users(:one))
    end

    assert_response :not_found
  end

  test "destroy deletes application and dependent resources" do
    application = create_application(users(:one))
    application.interviews.create!(scheduled_at: 1.day.from_now)
    application.tasks.create!(title: "削除対象タスク")
    application.notes.create!(body: "削除対象メモ")

    assert_difference(
      [ "Application.count", "Interview.count", "Task.count", "Note.count" ],
      -1
    ) do
      delete "/api/v1/applications/#{application.id}",
             headers: authorization_headers(users(:one))
    end

    assert_response :no_content
  end

  test "destroy returns validation error when deletion fails" do
    application = create_application(users(:one))

    with_stubbed_instance_method(
      Application,
      :destroy,
      lambda {
        errors.add(:base, "応募を削除できません")
        false
      }
    ) do
      assert_no_difference("Application.count") do
        delete "/api/v1/applications/#{application.id}",
               headers: authorization_headers(users(:one))
      end
    end

    assert_response :unprocessable_entity
    assert_equal "validation_error",
                 response.parsed_body.dig("error", "code")
    assert_predicate(
      response.parsed_body.dig("error", "details", "base"),
      :present?
    )
  end

  test "create without root key returns bad request" do
    post "/api/v1/applications",
         params: {},
         headers: authorization_headers(users(:one)),
         as: :json

    assert_response :bad_request
    assert_equal "bad_request", response.parsed_body.dig("error", "code")
  end

  private

  def create_application(user, title: "エンジニア", status: :applied)
    Application.create!(
      user: user,
      job_posting: create_job_posting(user, title),
      status: status,
      applied_on: Date.current
    )
  end

  def create_job_posting(user, title = "エンジニア")
    company = Company.create!(
      user: user,
      name: "#{title}の企業"
    )

    JobPosting.create!(
      user: user,
      company: company,
      title: title,
      source_url: "https://example.com/jobs/#{SecureRandom.hex(4)}"
    )
  end

  def authorization_headers(user)
    Devise::JWT::TestHelpers.auth_headers(
      {
        "Accept" => "application/json",
        "Content-Type" => "application/json"
      },
      user
    )
  end

  def select_query_count
    count = 0
    callback = lambda do |_name, _started, _finished, _unique_id, payload|
      next if payload[:name] == "SCHEMA"
      next unless payload[:sql].start_with?("SELECT")

      count += 1
    end

    ActiveSupport::Notifications.subscribed(
      callback,
      "sql.active_record"
    ) { yield }

    count
  end

  def with_stubbed_instance_method(model, method_name, replacement)
    original_method = model.instance_method(method_name)
    model.define_method(method_name, replacement)

    yield
  ensure
    model.define_method(method_name, original_method)
  end
end
