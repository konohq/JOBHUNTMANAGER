class KanbanApplicationCreator
  include ActiveModel::Model

  attr_accessor :company_name, :application_deadline
  attr_reader :application

  validates :company_name, presence: true, length: { maximum: 255 }
  validate :application_deadline_must_be_iso8601

  def initialize(user:, attributes:)
    @user = user
    super(attributes)
    self.company_name = company_name.to_s.strip
  end

  def save
    return false unless valid?

    ApplicationRecord.transaction do
      user.lock!

      if duplicate_application?
        errors.add(:company_name, "にはすでに応募が登録されています")
        raise ActiveRecord::Rollback
      end

      company = find_or_create_company!
      job_posting = create_job_posting!(company)
      @application = create_application!(job_posting)
    end

    application.present?
  rescue ActiveRecord::RecordInvalid => error
    copy_errors(error.record)
    @application = nil
    false
  end

  private

  attr_reader :user

  def duplicate_application?
    user.applications
      .joins(job_posting: :company)
      .where(companies: { name: company_name })
      .exists?
  end

  def find_or_create_company!
    user.companies.find_by(name: company_name) ||
      user.companies.create!(name: company_name)
  end

  def create_job_posting!(company)
    user.job_postings.create!(
      company: company,
      title: company_name,
      application_deadline: parsed_application_deadline
    )
  end

  def create_application!(job_posting)
    user.applications.create!(
      job_posting: job_posting,
      status: :applied,
      applied_on: Date.current
    )
  end

  def application_deadline_must_be_iso8601
    return if application_deadline.blank?

    parsed_application_deadline
  rescue Date::Error
    errors.add(:application_deadline, "はYYYY-MM-DD形式で入力してください")
  end

  def parsed_application_deadline
    return if application_deadline.blank?

    Date.iso8601(application_deadline.to_s)
  end

  def copy_errors(record)
    record.errors.each do |error|
      errors.add(mapped_attribute(record, error.attribute), error.message)
    end
  end

  def mapped_attribute(record, attribute)
    return :company_name if record.is_a?(Company) && attribute == :name
    return :company_name if record.is_a?(JobPosting) && attribute == :title

    attribute
  end
end
