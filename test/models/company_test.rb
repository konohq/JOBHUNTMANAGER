require "test_helper"

class CompanyTest < ActiveSupport::TestCase
  test "industry must be at most 255 characters" do
    company = Company.new(
      user: users(:one),
      name: "株式会社サンプル",
      industry: "a" * 256
    )

    assert_not company.valid?
    assert_predicate company.errors[:industry], :present?
  end

  test "location must be at most 255 characters" do
    company = Company.new(
      user: users(:one),
      name: "株式会社サンプル",
      location: "a" * 256
    )

    assert_not company.valid?
    assert_predicate company.errors[:location], :present?
  end

  test "description must be at most 10000 characters" do
    company = Company.new(
      user: users(:one),
      name: "株式会社サンプル",
      description: "a" * 10_001
    )

    assert_not company.valid?
    assert_predicate company.errors[:description], :present?
  end
end
