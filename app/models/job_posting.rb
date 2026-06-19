class JobPosting < ApplicationRecord
  URL_FORMAT = URI::DEFAULT_PARSER.make_regexp(%w[http https])

  belongs_to :user
  belongs_to :company

  has_one :application, dependent: :restrict_with_error

  validates :title, presence: true, length: { maximum: 255 }
  validates :source_url,
            format: { with: URL_FORMAT },
            length: { maximum: 2_048 },
            allow_blank: true
  validate :company_must_belong_to_user

  private

  def company_must_belong_to_user
    return if company.blank? || user.blank?
    return if company.user_id == user_id

    errors.add(:company, "はログインユーザーが所有する企業を指定してください")
  end
end
