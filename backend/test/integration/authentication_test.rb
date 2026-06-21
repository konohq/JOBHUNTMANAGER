require "test_helper"

class AuthenticationTest < ActionDispatch::IntegrationTest
  test "sign up returns a user and JWT" do
    assert_difference("User.count", 1) do
      post "/api/v1/auth",
           params: {
             user: {
               name: "新規ユーザー",
               email: "signup@example.com",
               password: "password",
               password_confirmation: "password"
             }
           },
           as: :json
    end

    assert_response :created
    assert_match(/\ABearer /, response.headers["Authorization"])
    assert_equal(
      {
        "name" => "新規ユーザー",
        "email" => "signup@example.com"
      },
      response.parsed_body.fetch("data").slice("name", "email")
    )
  end

  test "sign up returns validation errors" do
    post "/api/v1/auth",
         params: {
           user: {
             name: "",
             email: "invalid",
             password: "short",
             password_confirmation: "different"
           }
         },
         as: :json

    assert_response :unprocessable_entity
    assert_equal "validation_error", response.parsed_body.dig("error", "code")
    assert_predicate response.parsed_body.dig("error", "details"), :present?
  end

  test "JWT issued at sign in authenticates and is revoked at sign out" do
    jwt = sign_in_and_fetch_jwt(users(:one))

    assert_response :ok
    assert_equal users(:one).id, response.parsed_body.dig("data", "id")

    headers = bearer_headers(jwt)

    get "/api/v1/auth/me", headers: headers

    assert_response :ok
    assert_equal users(:one).id, response.parsed_body.dig("data", "id")

    delete "/api/v1/auth/sign_out", headers: headers

    assert_response :no_content

    get "/api/v1/auth/me", headers: headers

    assert_response :unauthorized
  end

  test "sign in rejects invalid credentials" do
    post "/api/v1/auth/sign_in",
         params: {
           user: {
             email: users(:one).email,
             password: "wrong-password"
           }
         },
         as: :json

    assert_response :unauthorized
    assert_equal "invalid_credentials",
                 response.parsed_body.dig("error", "code")
  end

  test "me returns the authenticated user" do
    get "/api/v1/auth/me", headers: authorization_headers(users(:one))

    assert_response :ok
    assert_equal users(:one).id, response.parsed_body.dig("data", "id")
  end

  test "me rejects an unauthenticated request" do
    get "/api/v1/auth/me"

    assert_response :unauthorized
    assert_equal "unauthorized", response.parsed_body.dig("error", "code")
  end

  test "sign in with json extension returns a JWT" do
    post "/api/v1/auth/sign_in.json",
         params: {
           user: {
             email: users(:one).email,
             password: "password"
           }
         },
         as: :json

    assert_response :ok
    assert_match(/\ABearer /, response.headers["Authorization"])
  end

  test "missing user parameter returns a common bad request error" do
    post "/api/v1/auth", params: {}, as: :json

    assert_response :bad_request
    assert_equal "bad_request", response.parsed_body.dig("error", "code")
    assert_equal(
      "リクエスト形式が正しくありません",
      response.parsed_body.dig("error", "message")
    )
  end

  private

  def sign_in_and_fetch_jwt(user)
    post "/api/v1/auth/sign_in",
         params: {
           user: {
             email: user.email,
             password: "password"
           }
         },
         as: :json

    authorization = response.headers["Authorization"]
    assert_match(/\ABearer /, authorization)

    authorization.delete_prefix("Bearer ")
  end

  def bearer_headers(jwt)
    {
      "Accept" => "application/json",
      "Content-Type" => "application/json",
      "Authorization" => "Bearer #{jwt}"
    }
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
end
