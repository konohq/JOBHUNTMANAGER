class Task < ApplicationRecord
  belongs_to :application

  enum :priority, {
    low: 0,
    medium: 1,
    high: 2
  }, validate: true

  validates :title, presence: true, length: { maximum: 255 }
  validate :due_at_must_be_valid

  private

  def due_at_must_be_valid
    raw_due_at = due_at_before_type_cast
    return if raw_due_at.blank? || due_at.present?

    errors.add(:due_at, "は正しい日時を指定してください")
  end
end
