class Company < ApplicationRecord
  URL_FORMAT = URI::DEFAULT_PARSER.make_regexp(%w[http https])

  belongs_to :user

  has_many :job_postings, dependent: :restrict_with_error

  validates :name, presence: true, length: { maximum: 255 }
  validates :website_url,
            format: { with: URL_FORMAT },
            length: { maximum: 2_048 },
            allow_blank: true
end
