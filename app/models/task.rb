class Task < ApplicationRecord
  belongs_to :application

  enum :priority, {
    low: 0,
    medium: 1,
    high: 2
  }, validate: true

  validates :title, presence: true, length: { maximum: 255 }
end
