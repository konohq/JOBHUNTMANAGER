require "test_helper"

class TasksTest < ActionDispatch::IntegrationTest
  test "all endpoints require authentication" do
    application = create_application(users(:one))
    task = create_task(application)

    requests = [
      -> { get "/api/v1/tasks" },
      lambda {
        post "/api/v1/applications/#{application.id}/tasks",
             params: { task: { title: "未認証タスク" } },
             as: :json
      },
      lambda {
        patch "/api/v1/tasks/#{task.id}",
              params: { task: { completed: true } },
              as: :json
      },
      -> { delete "/api/v1/tasks/#{task.id}" }
    ]

    requests.each do |request|
      request.call
      assert_response :unauthorized
      assert_equal "unauthorized", response.parsed_body.dig("error", "code")
    end
  end

  test "index returns only current user tasks with application details" do
    application = create_application(users(:one), title: "所有求人")
    later_task = create_task(
      application,
      title: "後の期限",
      due_at: 2.weeks.from_now
    )
    earlier_task = create_task(
      application,
      title: "先の期限",
      due_at: 1.week.from_now
    )
    other_application = create_application(users(:two), title: "他ユーザー求人")
    create_task(other_application, title: "他ユーザータスク")

    get "/api/v1/tasks",
        headers: authorization_headers(users(:one))

    assert_response :ok

    tasks = response.parsed_body.fetch("data")
    assert_equal [ earlier_task.id, later_task.id ], tasks.pluck("id")
    assert_equal application.id, tasks.first.dig("application", "id")
    assert_equal "所有求人",
                 tasks.first.dig("application", "job_posting", "title")
    assert_predicate(
      tasks.first.dig("application", "job_posting", "company"),
      :present?
    )
  end

  test "index calculates overdue from due time and completion" do
    application = create_application(users(:one))
    overdue_task = create_task(
      application,
      title: "期限超過",
      due_at: 1.day.ago
    )
    completed_task = create_task(
      application,
      title: "完了済み",
      due_at: 2.days.ago,
      completed_at: 1.day.ago
    )
    upcoming_task = create_task(
      application,
      title: "期限前",
      due_at: 1.day.from_now
    )

    get "/api/v1/tasks",
        headers: authorization_headers(users(:one))

    assert_response :ok

    tasks = response.parsed_body.fetch("data").index_by { |task| task["id"] }
    assert tasks.fetch(overdue_task.id).fetch("overdue")
    assert_not tasks.fetch(completed_task.id).fetch("overdue")
    assert_not tasks.fetch(upcoming_task.id).fetch("overdue")
  end

  test "index preloads application job posting and company without N plus one queries" do
    create_task(create_application(users(:one), title: "求人1"))

    first_query_count = select_query_count do
      get "/api/v1/tasks",
          headers: authorization_headers(users(:one))
    end

    create_task(create_application(users(:one), title: "求人2"))
    create_task(create_application(users(:one), title: "求人3"))

    multiple_query_count = select_query_count do
      get "/api/v1/tasks",
          headers: authorization_headers(users(:one))
    end

    assert_equal first_query_count, multiple_query_count
  end

  test "create associates task with owned application and handles due time" do
    application = create_application(users(:one))
    other_application = create_application(users(:two))

    assert_difference("application.tasks.count", 1) do
      post "/api/v1/applications/#{application.id}/tasks",
           params: {
             task: {
               title: "履歴書を送付",
               description: "採用担当者宛てに送付する",
               due_at: "2026-07-01T14:59:00Z",
               priority: "high",
               application_id: other_application.id
             }
           },
           headers: authorization_headers(users(:one)),
           as: :json
    end

    assert_response :created

    data = response.parsed_body.fetch("data")
    task = Task.find(data.fetch("id"))
    assert_equal application, task.application
    assert_equal "履歴書を送付", task.title
    assert_equal "high", task.priority
    assert_equal Time.zone.parse("2026-07-01T14:59:00Z"), task.due_at
    assert_equal application.id, data.fetch("application_id")
    assert_not data.fetch("overdue")
  end

  test "create returns not found for another user application" do
    application = create_application(users(:two))

    assert_no_difference("Task.count") do
      post "/api/v1/applications/#{application.id}/tasks",
           params: { task: { title: "不正なタスク" } },
           headers: authorization_headers(users(:one)),
           as: :json
    end

    assert_response :not_found
    assert_equal "not_found", response.parsed_body.dig("error", "code")
  end

  test "create returns validation errors for invalid title and priority" do
    application = create_application(users(:one))

    post "/api/v1/applications/#{application.id}/tasks",
         params: {
           task: {
             title: "a" * 256,
             priority: "unknown"
           }
         },
         headers: authorization_headers(users(:one)),
         as: :json

    assert_response :unprocessable_entity
    assert_equal "validation_error",
                 response.parsed_body.dig("error", "code")

    details = response.parsed_body.dig("error", "details")
    assert_predicate details["title"], :present?
    assert_predicate details["priority"], :present?
  end

  test "update completes and reopens task using completed parameter" do
    application = create_application(users(:one))
    task = create_task(application)
    completed_time = Time.zone.parse("2026-06-21T03:00:00Z")

    travel_to completed_time do
      patch "/api/v1/tasks/#{task.id}",
            params: { task: { completed: true } },
            headers: authorization_headers(users(:one)),
            as: :json
    end

    assert_response :ok
    assert_equal completed_time, task.reload.completed_at
    assert_predicate response.parsed_body.dig("data", "completed_at"), :present?

    patch "/api/v1/tasks/#{task.id}",
          params: { task: { completed: false } },
          headers: authorization_headers(users(:one)),
          as: :json

    assert_response :ok
    assert_nil task.reload.completed_at
    assert_nil response.parsed_body.dig("data", "completed_at")
  end

  test "update rejects completed values other than true or false" do
    task = create_task(create_application(users(:one)))

    patch "/api/v1/tasks/#{task.id}",
          params: { task: { completed: "invalid" } },
          headers: authorization_headers(users(:one)),
          as: :json

    assert_response :unprocessable_entity
    assert_equal "validation_error",
                 response.parsed_body.dig("error", "code")
    assert_predicate(
      response.parsed_body.dig("error", "details", "completed"),
      :present?
    )
    assert_nil task.reload.completed_at
  end

  test "create rejects invalid due time instead of saving it as nil" do
    application = create_application(users(:one))

    assert_no_difference("Task.count") do
      post "/api/v1/applications/#{application.id}/tasks",
           params: {
             task: {
               title: "不正な期限のタスク",
               due_at: "invalid-date"
             }
           },
           headers: authorization_headers(users(:one)),
           as: :json
    end

    assert_response :unprocessable_entity
    assert_equal "validation_error",
                 response.parsed_body.dig("error", "code")
    assert_predicate(
      response.parsed_body.dig("error", "details", "due_at"),
      :present?
    )
  end

  test "update changes task fields and cannot move task to another application" do
    application = create_application(users(:one))
    task = create_task(application)
    other_application = create_application(users(:two))

    patch "/api/v1/tasks/#{task.id}",
          params: {
            task: {
              title: "更新後タスク",
              due_at: "2026-07-15T10:00:00Z",
              priority: "low",
              application_id: other_application.id
            }
          },
          headers: authorization_headers(users(:one)),
          as: :json

    assert_response :ok

    task.reload
    assert_equal application, task.application
    assert_equal "更新後タスク", task.title
    assert_equal "low", task.priority
    assert_equal Time.zone.parse("2026-07-15T10:00:00Z"), task.due_at
  end

  test "update and destroy return not found for another user task" do
    task = create_task(create_application(users(:two)))

    patch "/api/v1/tasks/#{task.id}",
          params: { task: { completed: true } },
          headers: authorization_headers(users(:one)),
          as: :json

    assert_response :not_found
    assert_nil task.reload.completed_at

    assert_no_difference("Task.count") do
      delete "/api/v1/tasks/#{task.id}",
             headers: authorization_headers(users(:one))
    end

    assert_response :not_found
  end

  test "destroy deletes owned task" do
    task = create_task(create_application(users(:one)))

    assert_difference("Task.count", -1) do
      delete "/api/v1/tasks/#{task.id}",
             headers: authorization_headers(users(:one))
    end

    assert_response :no_content
  end

  test "destroy returns validation error when deletion fails" do
    task = create_task(create_application(users(:one)))

    with_stubbed_instance_method(
      Task,
      :destroy,
      lambda {
        errors.add(:base, "タスクを削除できません")
        false
      }
    ) do
      assert_no_difference("Task.count") do
        delete "/api/v1/tasks/#{task.id}",
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
    task = create_task(application)

    post "/api/v1/applications/#{application.id}/tasks",
         params: {},
         headers: authorization_headers(users(:one)),
         as: :json

    assert_response :bad_request
    assert_equal "bad_request", response.parsed_body.dig("error", "code")

    patch "/api/v1/tasks/#{task.id}",
          params: {},
          headers: authorization_headers(users(:one)),
          as: :json

    assert_response :bad_request
    assert_equal "bad_request", response.parsed_body.dig("error", "code")
  end

  private

  def create_application(user, title: "エンジニア")
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
      applied_on: Date.current
    )
  end

  def create_task(
    application,
    title: "応募書類を確認",
    due_at: nil,
    completed_at: nil
  )
    application.tasks.create!(
      title: title,
      due_at: due_at,
      completed_at: completed_at
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
