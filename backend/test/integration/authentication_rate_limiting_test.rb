require "test_helper"

class AuthenticationRateLimitingTest < ActionDispatch::IntegrationTest
  setup do
    Rack::Attack.enabled = true
    Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new
  end

  teardown do
    Rack::Attack.cache.store.clear
    Rack::Attack.enabled = false
  end

  test "sign in is rate limited by IP address" do
    Rack::Attack::LOGIN_LIMIT.times do
      post "/api/v1/auth/sign_in",
           params: {
             user: {
               email: users(:one).email,
               password: "wrong-password"
             }
           },
           as: :json

      assert_response :unauthorized
    end

    post "/api/v1/auth/sign_in",
         params: {
           user: {
             email: users(:one).email,
             password: "wrong-password"
           }
         },
         as: :json

    assert_rate_limit_response
  end

  test "sign up is rate limited by IP address" do
    Rack::Attack::SIGN_UP_LIMIT.times do |index|
      post "/api/v1/auth",
           params: {
             user: {
               name: "制限確認ユーザー#{index}",
               email: "rate-limit-#{index}@example.com",
               password: "password",
               password_confirmation: "password"
             }
           },
           as: :json

      assert_response :created
    end

    assert_no_difference("User.count") do
      post "/api/v1/auth",
           params: {
             user: {
               name: "制限超過ユーザー",
               email: "rate-limit-blocked@example.com",
               password: "password",
               password_confirmation: "password"
             }
           },
           as: :json
    end

    assert_rate_limit_response
  end

  private

  def assert_rate_limit_response
    assert_response :too_many_requests
    assert_equal(
      "application/json; charset=utf-8",
      response.headers["Content-Type"]
    )
    assert_predicate response.headers["Retry-After"].to_i, :positive?
    assert_equal(
      "rate_limit_exceeded",
      response.parsed_body.dig("error", "code")
    )
    assert_equal(
      "リクエスト回数が上限を超えました。時間をおいて再度お試しください",
      response.parsed_body.dig("error", "message")
    )
  end
end
