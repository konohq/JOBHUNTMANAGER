class Company < ApplicationRecord
  URL_FORMAT = URI::DEFAULT_PARSER.make_regexp(%w[http https])

  belongs_to :user

  has_many :job_postings, dependent: :restrict_with_error

  validates :name, presence: true, length: { maximum: 255 }
  validates :website_url,
            format: { with: URL_FORMAT },
            length: { maximum: 2_048 },
            allow_blank: true
  validates :industry, length: { maximum: 255 }, allow_blank: true
  validates :location, length: { maximum: 255 }, allow_blank: true
  validates :description, length: { maximum: 10_000 }, allow_blank: true
end
