class Note < ApplicationRecord
  belongs_to :application

  alias_attribute :content, :body

  validates :content, presence: true, length: { maximum: 10_000 }
end
