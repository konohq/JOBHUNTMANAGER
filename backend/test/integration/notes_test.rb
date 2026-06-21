require "test_helper"

class NotesTest < ActionDispatch::IntegrationTest
  test "all endpoints require authentication" do
    application = create_application(users(:one))
    note = create_note(application)

    requests = [
      -> { get "/api/v1/applications/#{application.id}/notes" },
      lambda {
        post "/api/v1/applications/#{application.id}/notes",
             params: { note: { content: "未認証メモ" } },
             as: :json
      },
      lambda {
        patch "/api/v1/notes/#{note.id}",
              params: { note: { content: "未認証更新" } },
              as: :json
      },
      -> { delete "/api/v1/notes/#{note.id}" }
    ]

    requests.each do |request|
      request.call
      assert_response :unauthorized
      assert_equal "unauthorized", response.parsed_body.dig("error", "code")
    end
  end

  test "index returns notes for owned application in newest first order" do
    application = create_application(users(:one))
    older_note = create_note(application, content: "古いメモ")
    newer_note = create_note(application, content: "新しいメモ")
    older_note.update_column(:created_at, 2.days.ago)
    newer_note.update_column(:created_at, 1.day.ago)

    get "/api/v1/applications/#{application.id}/notes",
        headers: authorization_headers(users(:one))

    assert_response :ok

    notes = response.parsed_body.fetch("data")
    assert_equal [ newer_note.id, older_note.id ], notes.pluck("id")
    assert_equal %w[新しいメモ 古いメモ], notes.pluck("content")
    assert_equal application.id, notes.first.fetch("application_id")
    assert_not_includes notes.first, "body"
  end

  test "index returns not found for another user application" do
    application = create_application(users(:two))
    create_note(application)

    get "/api/v1/applications/#{application.id}/notes",
        headers: authorization_headers(users(:one))

    assert_response :not_found
    assert_equal "not_found", response.parsed_body.dig("error", "code")
  end

  test "index does not add queries as note count increases" do
    application = create_application(users(:one))
    create_note(application, content: "メモ1")

    first_query_count = select_query_count do
      get "/api/v1/applications/#{application.id}/notes",
          headers: authorization_headers(users(:one))
    end

    create_note(application, content: "メモ2")
    create_note(application, content: "メモ3")

    multiple_query_count = select_query_count do
      get "/api/v1/applications/#{application.id}/notes",
          headers: authorization_headers(users(:one))
    end

    assert_equal first_query_count, multiple_query_count
  end

  test "create associates note with owned application using content" do
    application = create_application(users(:one))
    other_application = create_application(users(:two))

    assert_difference("application.notes.count", 1) do
      post "/api/v1/applications/#{application.id}/notes",
           params: {
             note: {
               content: "企業研究メモ",
               application_id: other_application.id
             }
           },
           headers: authorization_headers(users(:one)),
           as: :json
    end

    assert_response :created

    data = response.parsed_body.fetch("data")
    note = Note.find(data.fetch("id"))
    assert_equal application, note.application
    assert_equal "企業研究メモ", note.body
    assert_equal "企業研究メモ", data.fetch("content")
    assert_equal application.id, data.fetch("application_id")
    assert_not_includes data, "body"
  end

  test "create returns not found for another user application" do
    application = create_application(users(:two))

    assert_no_difference("Note.count") do
      post "/api/v1/applications/#{application.id}/notes",
           params: { note: { content: "不正なメモ" } },
           headers: authorization_headers(users(:one)),
           as: :json
    end

    assert_response :not_found
    assert_equal "not_found", response.parsed_body.dig("error", "code")
  end

  test "create returns validation error for blank content" do
    application = create_application(users(:one))

    assert_no_difference("Note.count") do
      post "/api/v1/applications/#{application.id}/notes",
           params: { note: { content: "   " } },
           headers: authorization_headers(users(:one)),
           as: :json
    end

    assert_response :unprocessable_entity
    assert_equal "validation_error",
                 response.parsed_body.dig("error", "code")
    assert_predicate(
      response.parsed_body.dig("error", "details", "content"),
      :present?
    )
  end

  test "create returns validation error for content exceeding maximum length" do
    application = create_application(users(:one))

    assert_no_difference("Note.count") do
      post "/api/v1/applications/#{application.id}/notes",
           params: { note: { content: "a" * 10_001 } },
           headers: authorization_headers(users(:one)),
           as: :json
    end

    assert_response :unprocessable_entity
    assert_equal "validation_error",
                 response.parsed_body.dig("error", "code")
    assert_predicate(
      response.parsed_body.dig("error", "details", "content"),
      :present?
    )
  end

  test "update changes content and cannot move note to another application" do
    application = create_application(users(:one))
    note = create_note(application)
    other_application = create_application(users(:two))

    patch "/api/v1/notes/#{note.id}",
          params: {
            note: {
              content: "更新後のメモ",
              application_id: other_application.id
            }
          },
          headers: authorization_headers(users(:one)),
          as: :json

    assert_response :ok

    note.reload
    assert_equal application, note.application
    assert_equal "更新後のメモ", note.body
    assert_equal "更新後のメモ",
                 response.parsed_body.dig("data", "content")
  end

  test "update and destroy return not found for another user note" do
    note = create_note(create_application(users(:two)))

    patch "/api/v1/notes/#{note.id}",
          params: { note: { content: "不正更新" } },
          headers: authorization_headers(users(:one)),
          as: :json

    assert_response :not_found
    assert_not_equal "不正更新", note.reload.body

    assert_no_difference("Note.count") do
      delete "/api/v1/notes/#{note.id}",
             headers: authorization_headers(users(:one))
    end

    assert_response :not_found
  end

  test "destroy deletes owned note" do
    note = create_note(create_application(users(:one)))

    assert_difference("Note.count", -1) do
      delete "/api/v1/notes/#{note.id}",
             headers: authorization_headers(users(:one))
    end

    assert_response :no_content
  end

  test "destroy returns validation error when deletion fails" do
    note = create_note(create_application(users(:one)))

    with_stubbed_instance_method(
      Note,
      :destroy,
      lambda {
        errors.add(:base, "メモを削除できません")
        false
      }
    ) do
      assert_no_difference("Note.count") do
        delete "/api/v1/notes/#{note.id}",
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

  test "create and update without root key return bad request" do
    application = create_application(users(:one))
    note = create_note(application)

    post "/api/v1/applications/#{application.id}/notes",
         params: {},
         headers: authorization_headers(users(:one)),
         as: :json

    assert_response :bad_request
    assert_equal "bad_request", response.parsed_body.dig("error", "code")

    patch "/api/v1/notes/#{note.id}",
          params: {},
          headers: authorization_headers(users(:one)),
          as: :json

    assert_response :bad_request
    assert_equal "bad_request", response.parsed_body.dig("error", "code")
  end

  private

  def create_application(user)
    company = Company.create!(
      user: user,
      name: "メモ対象企業"
    )
    job_posting = JobPosting.create!(
      user: user,
      company: company,
      title: "メモ対象求人"
    )

    Application.create!(
      user: user,
      job_posting: job_posting,
      applied_on: Date.current
    )
  end

  def create_note(application, content: "確認用メモ")
    application.notes.create!(content: content)
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
