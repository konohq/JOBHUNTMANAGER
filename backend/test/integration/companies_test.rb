require "test_helper"

class CompaniesTest < ActionDispatch::IntegrationTest
  test "index requires authentication" do
    get "/api/v1/companies"

    assert_response :unauthorized
    assert_equal "unauthorized", response.parsed_body.dig("error", "code")
  end

  test "create requires authentication" do
    assert_no_difference("Company.count") do
      post "/api/v1/companies",
           params: { company: { name: "未認証企業" } },
           as: :json
    end

    assert_response :unauthorized
    assert_equal "unauthorized", response.parsed_body.dig("error", "code")
  end

  test "index returns only current user companies with summary fields" do
    owned_company = Company.create!(
      user: users(:one),
      name: "株式会社ユーザー1"
    )
    Company.create!(
      user: users(:two),
      name: "株式会社ユーザー2"
    )

    get "/api/v1/companies", headers: authorization_headers(users(:one))

    assert_response :ok

    companies = response.parsed_body.fetch("data")
    assert_equal [ owned_company.id ], companies.pluck("id")
    assert_equal %w[id name], companies.first.keys.sort
  end

  test "create associates the company with current user" do
    assert_difference("users(:one).companies.count", 1) do
      post "/api/v1/companies",
           params: {
             company: {
               name: "株式会社サンプル",
               website_url: "https://example.com",
               industry: "IT",
               location: "東京都",
               description: "Webサービスを開発する企業",
               user_id: users(:two).id
             }
           },
           headers: authorization_headers(users(:one)),
           as: :json
    end

    assert_response :created

    company = Company.order(:id).last
    response_data = response.parsed_body.fetch("data")

    assert_equal users(:one), company.user
    assert_equal "株式会社サンプル", response_data.fetch("name")
    assert_equal "https://example.com", response_data.fetch("website_url")
    assert_not_includes response_data, "user_id"
  end

  test "create returns validation errors" do
    assert_no_difference("Company.count") do
      post "/api/v1/companies",
           params: {
             company: {
               name: "",
               website_url: "invalid-url"
             }
           },
           headers: authorization_headers(users(:one)),
           as: :json
    end

    assert_response :unprocessable_entity
    assert_equal "validation_error",
                 response.parsed_body.dig("error", "code")
    assert_predicate response.parsed_body.dig("error", "details"), :present?
  end

  test "create without company root key returns bad request" do
    post "/api/v1/companies",
         params: {},
         headers: authorization_headers(users(:one)),
         as: :json

    assert_response :bad_request
    assert_equal "bad_request", response.parsed_body.dig("error", "code")
  end

  private

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
