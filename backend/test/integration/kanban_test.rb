require "test_helper"

class KanbanTest < ActionDispatch::IntegrationTest
  test "kanban endpoints require authentication" do
    application = create_application(users(:one))

    get "/api/v1/kanban"

    assert_response :unauthorized
    assert_equal "unauthorized", response.parsed_body.dig("error", "code")

    patch "/api/v1/applications/#{application.id}/status",
          params: { application: { status: "offered" } },
          as: :json

    assert_response :unauthorized
    assert_equal "unauthorized", response.parsed_body.dig("error", "code")
  end

  test "show groups only current user applications into every status column" do
    applied = create_application(
      users(:one),
      title: "応募済み求人",
      status: :applied
    )
    screening = create_application(
      users(:one),
      title: "書類選考求人",
      status: :document_screening
    )
    create_application(users(:two), title: "他ユーザー求人")

    get "/api/v1/kanban",
        headers: authorization_headers(users(:one))

    assert_response :ok

    columns = response.parsed_body.fetch("data")
    assert_equal Application.statuses.keys, columns.keys
    assert_equal [ applied.id ], columns.fetch("applied").pluck("id")
    assert_equal [ screening.id ],
                 columns.fetch("document_screening").pluck("id")
    assert_empty columns.fetch("interview_scheduled")
    assert_empty columns.fetch("offered")
    assert_empty columns.fetch("rejected")
  end

  test "show orders each column by updated time descending" do
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
    older_application.update_column(:updated_at, 2.days.ago)
    newer_application.update_column(:updated_at, 1.day.ago)

    get "/api/v1/kanban",
        headers: authorization_headers(users(:one))

    assert_response :ok
    assert_equal(
      [ newer_application.id, older_application.id ],
      response.parsed_body.dig("data", "applied").pluck("id")
    )
  end

  test "show returns fields required by kanban cards" do
    application = create_application(
      users(:one),
      title: "バックエンドエンジニア",
      company_name: "株式会社サンプル",
      status: :interview_scheduled,
      applied_on: Date.new(2026, 6, 21)
    )

    get "/api/v1/kanban",
        headers: authorization_headers(users(:one))

    assert_response :ok

    card = response.parsed_body
      .dig("data", "interview_scheduled")
      .first
    assert_equal application.id, card.fetch("id")
    assert_equal "interview_scheduled", card.fetch("status")
    assert_equal "2026-06-21", card.fetch("applied_on")
    assert_equal "株式会社サンプル", card.dig("company", "name")
    assert_equal "バックエンドエンジニア",
                 card.dig("job_posting", "title")
    assert_predicate card.fetch("updated_at"), :present?
  end

  test "show preloads job posting and company without N plus one queries" do
    create_application(users(:one), title: "求人1", company_name: "企業1")

    first_query_count = select_query_count do
      get "/api/v1/kanban",
          headers: authorization_headers(users(:one))
    end

    create_application(users(:one), title: "求人2", company_name: "企業2")
    create_application(users(:one), title: "求人3", company_name: "企業3")

    multiple_query_count = select_query_count do
      get "/api/v1/kanban",
          headers: authorization_headers(users(:one))
    end

    assert_equal first_query_count, multiple_query_count
  end

  test "update changes only status and moves card to the top of destination column" do
    existing_application = create_application(
      users(:one),
      title: "既存の内定",
      status: :offered
    )
    moving_application = create_application(
      users(:one),
      title: "移動する応募",
      status: :applied,
      applied_on: Date.new(2026, 6, 1)
    )
    existing_application.update_column(:updated_at, 1.day.ago)
    changed_at = Time.zone.parse("2026-06-21T06:00:00Z")

    travel_to changed_at do
      patch "/api/v1/applications/#{moving_application.id}/status",
            params: {
              application: {
                status: "offered",
                applied_on: "2026-01-01"
              }
            },
            headers: authorization_headers(users(:one)),
            as: :json
    end

    assert_response :ok

    moving_application.reload
    assert_equal "offered", moving_application.status
    assert_equal Date.new(2026, 6, 1), moving_application.applied_on
    assert_equal changed_at, moving_application.updated_at
    assert_equal "offered", response.parsed_body.dig("data", "status")

    get "/api/v1/kanban",
        headers: authorization_headers(users(:one))

    assert_equal moving_application.id,
                 response.parsed_body.dig("data", "offered", 0, "id")
  end

  test "update returns not found for another user application" do
    application = create_application(users(:two))

    patch "/api/v1/applications/#{application.id}/status",
          params: { application: { status: "offered" } },
          headers: authorization_headers(users(:one)),
          as: :json

    assert_response :not_found
    assert_equal "not_found", response.parsed_body.dig("error", "code")
    assert_not_equal "offered", application.reload.status
  end

  test "update returns validation error for invalid status" do
    application = create_application(users(:one))

    patch "/api/v1/applications/#{application.id}/status",
          params: { application: { status: "unknown" } },
          headers: authorization_headers(users(:one)),
          as: :json

    assert_response :unprocessable_entity
    assert_equal "validation_error",
                 response.parsed_body.dig("error", "code")
    assert_predicate(
      response.parsed_body.dig("error", "details", "status"),
      :present?
    )
    assert_equal "applied", application.reload.status
  end

  test "update without application root key returns bad request" do
    application = create_application(users(:one))

    patch "/api/v1/applications/#{application.id}/status",
          params: {},
          headers: authorization_headers(users(:one)),
          as: :json

    assert_response :bad_request
    assert_equal "bad_request", response.parsed_body.dig("error", "code")
  end

  private

  def create_application(
    user,
    title: "エンジニア",
    company_name: "株式会社サンプル",
    status: :applied,
    applied_on: Date.current
  )
    company = Company.create!(user: user, name: company_name)
    job_posting = JobPosting.create!(
      user: user,
      company: company,
      title: title
    )

    Application.create!(
      user: user,
      job_posting: job_posting,
      status: status,
      applied_on: applied_on
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
