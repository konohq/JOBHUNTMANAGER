class KanbanCardSerializer
  def initialize(application)
    @application = application
  end

  def serializable_hash
    {
      id: application.id,
      status: application.status,
      applied_on: application.applied_on,
      company: {
        id: company.id,
        name: company.name
      },
      job_posting: {
        id: job_posting.id,
        title: job_posting.title,
        application_deadline: job_posting.application_deadline
      },
      updated_at: application.updated_at
    }
  end

  private

  attr_reader :application

  def job_posting
    application.job_posting
  end

  def company
    job_posting.company
  end
end
