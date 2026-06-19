class Application < ApplicationRecord
  belongs_to :user
  belongs_to :job_posting

  has_many :interviews, dependent: :destroy
  has_many :tasks, dependent: :destroy
  has_many :notes, dependent: :destroy

  enum :status, {
    applied: 0,
    document_screening: 1,
    interview_scheduled: 2,
    offered: 3,
    rejected: 4
  }, validate: true

  validates :applied_on, presence: true
  validates :job_posting_id, uniqueness: true
  validate :job_posting_must_belong_to_user

  private

  def job_posting_must_belong_to_user
    return if job_posting.blank? || user.blank?
    return if job_posting.user_id == user_id

    errors.add(:job_posting, "はログインユーザーが所有する求人を指定してください")
  end
end
