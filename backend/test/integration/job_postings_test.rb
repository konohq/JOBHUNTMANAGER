require "test_helper"

class JobPostingsTest < ActionDispatch::IntegrationTest
  test "all endpoints require authentication" do
    company = create_company(users(:one))
    job_posting = create_job_posting(users(:one), company)

    requests = [
      -> { get "/api/v1/job_postings" },
      lambda {
        post "/api/v1/job_postings",
             params: {
               job_posting: {
                 company_id: company.id,
                 title: "未認証求人"
               }
             },
             as: :json
      },
      -> { get "/api/v1/job_postings/#{job_posting.id}" },
      lambda {
        patch "/api/v1/job_postings/#{job_posting.id}",
              params: { job_posting: { title: "未認証更新" } },
              as: :json
      },
      -> { delete "/api/v1/job_postings/#{job_posting.id}" }
    ]

    requests.each do |request|
      request.call
      assert_response :unauthorized
      assert_equal "unauthorized", response.parsed_body.dig("error", "code")
    end
  end

  test "index returns only current user job postings" do
    owned_company = create_company(users(:one), "所有企業")
    other_company = create_company(users(:two), "他ユーザー企業")
    owned_job = create_job_posting(users(:one), owned_company, "所有求人")
    create_job_posting(users(:two), other_company, "他ユーザー求人")

    get "/api/v1/job_postings", headers: authorization_headers(users(:one))

    assert_response :ok

    job_postings = response.parsed_body.fetch("data")
    assert_equal [ owned_job.id ], job_postings.pluck("id")
    assert_equal owned_company.id,
                 job_postings.first.dig("company", "id")
  end

  test "index preloads company and application without N plus one queries" do
    company = create_company(users(:one))
    create_job_posting(users(:one), company, "求人1")

    first_query_count = select_query_count do
      get "/api/v1/job_postings", headers: authorization_headers(users(:one))
    end

    create_job_posting(users(:one), company, "求人2")
    create_job_posting(users(:one), company, "求人3")

    multiple_query_count = select_query_count do
      get "/api/v1/job_postings", headers: authorization_headers(users(:one))
    end

    assert_equal first_query_count, multiple_query_count
  end

  test "show returns current user job posting with application" do
    company = create_company(users(:one))
    job_posting = create_job_posting(users(:one), company)
    application = Application.create!(
      user: users(:one),
      job_posting: job_posting,
      applied_on: Date.current
    )

    get "/api/v1/job_postings/#{job_posting.id}",
        headers: authorization_headers(users(:one))

    assert_response :ok
    assert_equal application.id,
                 response.parsed_body.dig("data", "application", "id")
    assert_equal "applied",
                 response.parsed_body.dig("data", "application", "status")
  end

  test "show returns not found for another user job posting" do
    company = create_company(users(:two))
    job_posting = create_job_posting(users(:two), company)

    get "/api/v1/job_postings/#{job_posting.id}",
        headers: authorization_headers(users(:one))

    assert_response :not_found
    assert_equal "not_found", response.parsed_body.dig("error", "code")
  end

  test "create associates job posting with current user and owned company" do
    company = create_company(users(:one))

    assert_difference("users(:one).job_postings.count", 1) do
      post "/api/v1/job_postings",
           params: {
             job_posting: {
               company_id: company.id,
               title: "バックエンドエンジニア",
               employment_type: "正社員",
               location: "東京都",
               source_url: "https://example.com/jobs/1",
               description: "Rails APIの開発",
               application_deadline: "2026-07-31",
               user_id: users(:two).id
             }
           },
           headers: authorization_headers(users(:one)),
           as: :json
    end

    assert_response :created

    response_data = response.parsed_body.fetch("data")
    job_posting = JobPosting.find(response_data.fetch("id"))

    assert_equal users(:one), job_posting.user
    assert_equal company, job_posting.company
    assert_not_includes response_data, "user_id"
  end

  test "create rejects another user company" do
    company = create_company(users(:two))

    assert_no_difference("JobPosting.count") do
      post "/api/v1/job_postings",
           params: {
             job_posting: {
               company_id: company.id,
               title: "不正な求人"
             }
           },
           headers: authorization_headers(users(:one)),
           as: :json
    end

    assert_response :not_found
    assert_equal "not_found", response.parsed_body.dig("error", "code")
  end

  test "create requires company" do
    assert_no_difference("JobPosting.count") do
      post "/api/v1/job_postings",
           params: {
             job_posting: {
               title: "企業未指定求人"
             }
           },
           headers: authorization_headers(users(:one)),
           as: :json
    end

    assert_response :unprocessable_entity
    assert_equal "validation_error",
                 response.parsed_body.dig("error", "code")
  end

  test "create returns validation errors" do
    company = create_company(users(:one))

    post "/api/v1/job_postings",
         params: {
           job_posting: {
             company_id: company.id,
             title: "",
             source_url: "invalid-url"
           }
         },
         headers: authorization_headers(users(:one)),
         as: :json

    assert_response :unprocessable_entity
    assert_equal "validation_error",
                 response.parsed_body.dig("error", "code")
  end

  test "update changes fields and accepts only owned company" do
    company = create_company(users(:one), "変更前企業")
    new_company = create_company(users(:one), "変更後企業")
    job_posting = create_job_posting(users(:one), company)

    patch "/api/v1/job_postings/#{job_posting.id}",
          params: {
            job_posting: {
              company_id: new_company.id,
              title: "更新後求人",
              location: "大阪府"
            }
          },
          headers: authorization_headers(users(:one)),
          as: :json

    assert_response :ok

    job_posting.reload
    assert_equal new_company, job_posting.company
    assert_equal "更新後求人", job_posting.title
    assert_equal "大阪府", job_posting.location
  end

  test "update rejects another user company without changing job posting" do
    company = create_company(users(:one))
    other_company = create_company(users(:two))
    job_posting = create_job_posting(users(:one), company)

    patch "/api/v1/job_postings/#{job_posting.id}",
          params: {
            job_posting: {
              company_id: other_company.id,
              title: "変更されない求人"
            }
          },
          headers: authorization_headers(users(:one)),
          as: :json

    assert_response :not_found
    assert_equal company, job_posting.reload.company
    assert_not_equal "変更されない求人", job_posting.title
  end

  test "update with null company validates the null value instead of ignoring it" do
    company = create_company(users(:one))
    job_posting = create_job_posting(users(:one), company)

    patch "/api/v1/job_postings/#{job_posting.id}",
          params: {
            job_posting: {
              company_id: nil
            }
          },
          headers: authorization_headers(users(:one)),
          as: :json

    assert_response :unprocessable_entity
    assert_equal "validation_error",
                 response.parsed_body.dig("error", "code")
    assert_predicate(
      response.parsed_body.dig("error", "details", "company"),
      :present?
    )
    assert_equal company, job_posting.reload.company
  end

  test "create rejects fields exceeding maximum lengths" do
    company = create_company(users(:one))

    post "/api/v1/job_postings",
         params: {
           job_posting: {
             company_id: company.id,
             title: "文字数超過求人",
             employment_type: "a" * 256,
             location: "a" * 256,
             description: "a" * 10_001
           }
         },
         headers: authorization_headers(users(:one)),
         as: :json

    assert_response :unprocessable_entity

    details = response.parsed_body.dig("error", "details")
    assert_predicate details["employment_type"], :present?
    assert_predicate details["location"], :present?
    assert_predicate details["description"], :present?
  end

  test "update and destroy return not found for another user job posting" do
    company = create_company(users(:two))
    job_posting = create_job_posting(users(:two), company)

    patch "/api/v1/job_postings/#{job_posting.id}",
          params: { job_posting: { title: "不正更新" } },
          headers: authorization_headers(users(:one)),
          as: :json

    assert_response :not_found
    assert_not_equal "不正更新", job_posting.reload.title

    assert_no_difference("JobPosting.count") do
      delete "/api/v1/job_postings/#{job_posting.id}",
             headers: authorization_headers(users(:one))
    end

    assert_response :not_found
  end

  test "destroy deletes job posting without application" do
    company = create_company(users(:one))
    job_posting = create_job_posting(users(:one), company)

    assert_difference("JobPosting.count", -1) do
      delete "/api/v1/job_postings/#{job_posting.id}",
             headers: authorization_headers(users(:one))
    end

    assert_response :no_content
  end

  test "destroy rejects job posting with application" do
    company = create_company(users(:one))
    job_posting = create_job_posting(users(:one), company)
    Application.create!(
      user: users(:one),
      job_posting: job_posting,
      applied_on: Date.current
    )

    assert_no_difference("JobPosting.count") do
      delete "/api/v1/job_postings/#{job_posting.id}",
             headers: authorization_headers(users(:one))
    end

    assert_response :unprocessable_entity
    assert_equal "dependent_exists",
                 response.parsed_body.dig("error", "code")
  end

  test "create without root key returns bad request" do
    post "/api/v1/job_postings",
         params: {},
         headers: authorization_headers(users(:one)),
         as: :json

    assert_response :bad_request
    assert_equal "bad_request", response.parsed_body.dig("error", "code")
  end

  private

  def create_company(user, name = "株式会社サンプル")
    Company.create!(user: user, name: name)
  end

  def create_job_posting(user, company, title = "エンジニア")
    JobPosting.create!(
      user: user,
      company: company,
      title: title
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
end
