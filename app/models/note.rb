class Note < ApplicationRecord
  belongs_to :application

  validates :body, presence: true
end
