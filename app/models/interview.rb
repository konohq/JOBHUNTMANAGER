class Interview < ApplicationRecord
  belongs_to :application

  enum :interview_type, {
    casual: 0,
    first: 1,
    second: 2,
    final: 3,
    other: 4
  }, prefix: true, validate: true

  enum :status, {
    scheduled: 0,
    completed: 1,
    canceled: 2
  }, prefix: true, validate: true

  enum :result, {
    pending: 0,
    passed: 1,
    failed: 2
  }, prefix: true, validate: true

  validates :scheduled_at, presence: true
  validates :meeting_url,
            format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]) },
            length: { maximum: 2_048 },
            allow_blank: true
end
