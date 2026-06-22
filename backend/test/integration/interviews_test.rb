require "test_helper"

class InterviewsTest < ActionDispatch::IntegrationTest
  test "all endpoints require authentication" do
    application = create_application(users(:one))
    interview = create_interview(application)

    requests = [
      -> { get "/api/v1/interviews" },
      -> { get "/api/v1/applications/#{application.id}/interviews" },
      lambda {
        post "/api/v1/applications/#{application.id}/interviews",
             params: {
               interview: {
                 scheduled_at: 1.week.from_now
               }
             },
             as: :json
      },
      lambda {
        patch "/api/v1/interviews/#{interview.id}",
              params: { interview: { result: "passed" } },
              as: :json
      },
      -> { delete "/api/v1/interviews/#{interview.id}" }
    ]

    requests.each do |request|
      request.call
      assert_response :unauthorized
      assert_equal "unauthorized", response.parsed_body.dig("error", "code")
    end
  end

  test "application index returns only interviews for owned application" do
    application = create_application(users(:one), title: "対象求人")
    earlier_interview = create_interview(
      application,
      scheduled_at: 1.week.from_now,
      interview_type: :first
    )
    later_interview = create_interview(
      application,
      scheduled_at: 2.weeks.from_now,
      interview_type: :second
    )
    other_application = create_application(users(:one), title: "別求人")
    create_interview(other_application, scheduled_at: 3.days.from_now)

    get "/api/v1/applications/#{application.id}/interviews",
        headers: authorization_headers(users(:one))

    assert_response :ok

    interviews = response.parsed_body.fetch("data")
    assert_equal [ earlier_interview.id, later_interview.id ],
                 interviews.pluck("id")
    assert interviews.all? do |interview|
      interview["application_id"] == application.id
    end
    assert interviews.none? { |interview| interview.key?("application") }
  end

  test "application index returns not found for another user application" do
    application = create_application(users(:two))

    get "/api/v1/applications/#{application.id}/interviews",
        headers: authorization_headers(users(:one))

    assert_response :not_found
    assert_equal "not_found", response.parsed_body.dig("error", "code")
  end

  test "index returns only current user interviews ordered by scheduled time" do
    application = create_application(users(:one), title: "所有求人")
    later_interview = create_interview(
      application,
      scheduled_at: 2.weeks.from_now,
      interview_type: :second
    )
    earlier_interview = create_interview(
      application,
      scheduled_at: 1.week.from_now,
      interview_type: :first
    )
    other_application = create_application(users(:two), title: "他ユーザー求人")
    create_interview(other_application, scheduled_at: 1.day.from_now)

    get "/api/v1/interviews",
        headers: authorization_headers(users(:one))

    assert_response :ok

    interviews = response.parsed_body.fetch("data")
    assert_equal [ earlier_interview.id, later_interview.id ],
                 interviews.pluck("id")
    assert_equal %w[first second], interviews.pluck("interview_type")
    assert_equal application.id,
                 interviews.first.dig("application", "id")
    assert_equal "所有求人",
                 interviews.first.dig("application", "job_posting", "title")
    assert_predicate(
      interviews.first.dig("application", "job_posting", "company"),
      :present?
    )
  end

  test "index preloads application job posting and company without N plus one queries" do
    application = create_application(users(:one))
    create_interview(application, scheduled_at: 1.week.from_now)

    first_query_count = select_query_count do
      get "/api/v1/interviews",
          headers: authorization_headers(users(:one))
    end

    create_interview(application, scheduled_at: 2.weeks.from_now)
    create_interview(application, scheduled_at: 3.weeks.from_now)

    multiple_query_count = select_query_count do
      get "/api/v1/interviews",
          headers: authorization_headers(users(:one))
    end

    assert_equal first_query_count, multiple_query_count
  end

  test "create associates interview with owned application and handles result" do
    application = create_application(
      users(:one),
      status: :document_screening
    )
    original_application_status = application.status

    assert_difference("application.interviews.count", 1) do
      post "/api/v1/applications/#{application.id}/interviews",
           params: {
             interview: {
               interview_type: "first",
               scheduled_at: "2026-07-01T04:00:00Z",
               location: "東京都",
               meeting_url: "https://meet.example.com/interview",
               status: "completed",
               result: "passed",
               interviewer: "採用担当者",
               details: "一次面接通過",
               application_id: create_application(users(:two)).id
             }
           },
           headers: authorization_headers(users(:one)),
           as: :json
    end

    assert_response :created

    data = response.parsed_body.fetch("data")
    interview = Interview.find(data.fetch("id"))
    assert_equal application, interview.application
    assert_equal "first", interview.interview_type
    assert_equal "completed", interview.status
    assert_equal "passed", interview.result
    assert_equal application.id, data.fetch("application_id")
    assert_equal original_application_status, application.reload.status
  end

  test "create returns not found for another user application" do
    application = create_application(users(:two))

    assert_no_difference("Interview.count") do
      post "/api/v1/applications/#{application.id}/interviews",
           params: {
             interview: {
               scheduled_at: 1.week.from_now
             }
           },
           headers: authorization_headers(users(:one)),
           as: :json
    end

    assert_response :not_found
    assert_equal "not_found", response.parsed_body.dig("error", "code")
  end

  test "create returns validation errors for missing schedule and invalid enums" do
    application = create_application(users(:one))

    post "/api/v1/applications/#{application.id}/interviews",
         params: {
           interview: {
             interview_type: "unknown",
             scheduled_at: nil,
             status: "unknown",
             result: "unknown"
           }
         },
         headers: authorization_headers(users(:one)),
         as: :json

    assert_response :unprocessable_entity
    assert_equal "validation_error",
                 response.parsed_body.dig("error", "code")

    details = response.parsed_body.dig("error", "details")
    assert_predicate details["interview_type"], :present?
    assert_predicate details["scheduled_at"], :present?
    assert_predicate details["status"], :present?
    assert_predicate details["result"], :present?
  end

  test "create returns validation error for invalid meeting url" do
    application = create_application(users(:one))

    post "/api/v1/applications/#{application.id}/interviews",
         params: {
           interview: {
             scheduled_at: 1.week.from_now,
             meeting_url: "invalid-url"
           }
         },
         headers: authorization_headers(users(:one)),
         as: :json

    assert_response :unprocessable_entity
    assert_predicate(
      response.parsed_body.dig("error", "details", "meeting_url"),
      :present?
    )
  end

  test "create returns validation errors for fields exceeding maximum lengths" do
    application = create_application(users(:one))

    post "/api/v1/applications/#{application.id}/interviews",
         params: {
           interview: {
             scheduled_at: 1.week.from_now,
             location: "a" * 256,
             interviewer: "a" * 256,
             details: "a" * 10_001
           }
         },
         headers: authorization_headers(users(:one)),
         as: :json

    assert_response :unprocessable_entity
    assert_equal "validation_error",
                 response.parsed_body.dig("error", "code")

    details = response.parsed_body.dig("error", "details")
    assert_predicate details["location"], :present?
    assert_predicate details["interviewer"], :present?
    assert_predicate details["details"], :present?
  end

  test "update changes interview fields and result without changing application status" do
    application = create_application(
      users(:one),
      status: :interview_scheduled
    )
    interview = create_interview(application)
    original_application_status = application.status

    patch "/api/v1/interviews/#{interview.id}",
          params: {
            interview: {
              status: "completed",
              result: "failed",
              details: "今回は見送り"
            }
          },
          headers: authorization_headers(users(:one)),
          as: :json

    assert_response :ok

    interview.reload
    assert_equal "completed", interview.status
    assert_equal "failed", interview.result
    assert_equal "今回は見送り", interview.details
    assert_equal "failed", response.parsed_body.dig("data", "result")
    assert_equal original_application_status, application.reload.status
  end

  test "update cannot move interview to another application" do
    application = create_application(users(:one))
    interview = create_interview(application)
    other_application = create_application(users(:two))

    patch "/api/v1/interviews/#{interview.id}",
          params: {
            interview: {
              application_id: other_application.id,
              result: "passed"
            }
          },
          headers: authorization_headers(users(:one)),
          as: :json

    assert_response :ok
    assert_equal application, interview.reload.application
    assert_equal "passed", interview.result
  end

  test "update and destroy return not found for another user interview" do
    application = create_application(users(:two))
    interview = create_interview(application)

    patch "/api/v1/interviews/#{interview.id}",
          params: { interview: { result: "passed" } },
          headers: authorization_headers(users(:one)),
          as: :json

    assert_response :not_found
    assert_not_equal "passed", interview.reload.result

    assert_no_difference("Interview.count") do
      delete "/api/v1/interviews/#{interview.id}",
             headers: authorization_headers(users(:one))
    end

    assert_response :not_found
  end

  test "destroy deletes owned interview" do
    application = create_application(users(:one))
    interview = create_interview(application)

    assert_difference("Interview.count", -1) do
      delete "/api/v1/interviews/#{interview.id}",
             headers: authorization_headers(users(:one))
    end

    assert_response :no_content
  end

  test "destroy returns validation error when deletion fails" do
    application = create_application(users(:one))
    interview = create_interview(application)

    with_stubbed_instance_method(
      Interview,
      :destroy,
      lambda {
        errors.add(:base, "面接を削除できません")
        false
      }
    ) do
      assert_no_difference("Interview.count") do
        delete "/api/v1/interviews/#{interview.id}",
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
    interview = create_interview(application)

    post "/api/v1/applications/#{application.id}/interviews",
         params: {},
         headers: authorization_headers(users(:one)),
         as: :json

    assert_response :bad_request
    assert_equal "bad_request", response.parsed_body.dig("error", "code")

    patch "/api/v1/interviews/#{interview.id}",
          params: {},
          headers: authorization_headers(users(:one)),
          as: :json

    assert_response :bad_request
    assert_equal "bad_request", response.parsed_body.dig("error", "code")
  end

  private

  def create_application(user, title: "エンジニア", status: :applied)
    company = Company.create!(
      user: user,
      name: "#{title}の企業"
    )
    job_posting = JobPosting.create!(
      user: user,
      company: company,
      title: title
    )

    Application.create!(
      user: user,
      job_posting: job_posting,
      status: status,
      applied_on: Date.current
    )
  end

  def create_interview(
    application,
    scheduled_at: 1.week.from_now,
    interview_type: :casual
  )
    application.interviews.create!(
      scheduled_at: scheduled_at,
      interview_type: interview_type
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
