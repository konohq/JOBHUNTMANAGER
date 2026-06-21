class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  has_many :companies, dependent: :restrict_with_error
  has_many :job_postings, dependent: :restrict_with_error
  has_many :applications, dependent: :restrict_with_error

  validates :name, presence: true, length: { maximum: 255 }
end
