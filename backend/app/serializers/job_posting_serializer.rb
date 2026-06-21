class JobPostingSerializer
  def initialize(job_posting, summary: false)
    @job_posting = job_posting
    @summary = summary
  end

  def serializable_hash
    return summary_hash if summary

    summary_hash
      .except(:application_id)
      .merge(
        source_url: job_posting.source_url,
        description: job_posting.description,
        application: serialized_application
      )
  end

  private

  attr_reader :job_posting, :summary

  def summary_hash
    {
      id: job_posting.id,
      title: job_posting.title,
      employment_type: job_posting.employment_type,
      location: job_posting.location,
      application_deadline: job_posting.application_deadline,
      company: serialized_company,
      application_id: job_posting.application&.id,
      created_at: job_posting.created_at,
      updated_at: job_posting.updated_at
    }
  end

  def serialized_company
    CompanySerializer
      .new(job_posting.company, summary: true)
      .serializable_hash
  end

  def serialized_application
    application = job_posting.application
    return if application.blank?

    {
      id: application.id,
      status: application.status,
      applied_on: application.applied_on
    }
  end
end
