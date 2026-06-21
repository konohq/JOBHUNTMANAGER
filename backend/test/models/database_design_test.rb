require "test_helper"

class DatabaseDesignTest < ActiveSupport::TestCase
  test "JTIMatcher generates jti for a new user" do
    user = User.create!(
      name: "新規ユーザー",
      email: "new-user@example.com",
      password: "password"
    )

    assert_predicate user.jti, :present?
  end

  test "child resources do not have user_id" do
    assert_not_includes Interview.column_names, "user_id"
    assert_not_includes Task.column_names, "user_id"
    assert_not_includes Note.column_names, "user_id"
  end

  test "job posting company must belong to the same user" do
    company = Company.create!(user: users(:one), name: "ユーザー1の企業")
    job_posting = JobPosting.new(
      user: users(:two),
      company: company,
      title: "バックエンドエンジニア"
    )

    assert_not job_posting.valid?
    assert_includes job_posting.errors[:company],
                    "はログインユーザーが所有する企業を指定してください"
  end

  test "application job posting must belong to the same user" do
    company = Company.create!(user: users(:one), name: "ユーザー1の企業")
    job_posting = JobPosting.create!(
      user: users(:one),
      company: company,
      title: "バックエンドエンジニア"
    )
    application = Application.new(
      user: users(:two),
      job_posting: job_posting,
      applied_on: Date.current
    )

    assert_not application.valid?
    assert_includes application.errors[:job_posting],
                    "はログインユーザーが所有する求人を指定してください"
  end

  test "one job posting accepts only one application" do
    company = Company.create!(user: users(:one), name: "応募先企業")
    job_posting = JobPosting.create!(
      user: users(:one),
      company: company,
      title: "フロントエンドエンジニア"
    )
    Application.create!(
      user: users(:one),
      job_posting: job_posting,
      applied_on: Date.current
    )
    duplicate = Application.new(
      user: users(:one),
      job_posting: job_posting,
      applied_on: Date.current
    )

    assert_not duplicate.valid?
    assert_predicate duplicate.errors[:job_posting_id], :present?
  end

  test "application destroys its child resources" do
    company = Company.create!(user: users(:one), name: "連鎖削除確認企業")
    job_posting = JobPosting.create!(
      user: users(:one),
      company: company,
      title: "インフラエンジニア"
    )
    application = Application.create!(
      user: users(:one),
      job_posting: job_posting,
      applied_on: Date.current
    )
    interview = application.interviews.create!(scheduled_at: 1.day.from_now)
    task = application.tasks.create!(title: "書類を提出")
    note = application.notes.create!(body: "確認用メモ")

    application.destroy!

    assert_not Interview.exists?(interview.id)
    assert_not Task.exists?(task.id)
    assert_not Note.exists?(note.id)
  end

  test "company and job posting reject deletion when child data exists" do
    company = Company.create!(user: users(:one), name: "削除制約確認企業")
    job_posting = JobPosting.create!(
      user: users(:one),
      company: company,
      title: "QAエンジニア"
    )
    Application.create!(
      user: users(:one),
      job_posting: job_posting,
      applied_on: Date.current
    )

    assert_not job_posting.destroy
    assert_not company.destroy
    assert_predicate job_posting.errors, :present?
    assert_predicate company.errors, :present?
  end
end
