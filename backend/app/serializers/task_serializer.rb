class TaskSerializer
  def initialize(task, include_application: false)
    @task = task
    @include_application = include_application
  end

  def serializable_hash
    data = {
      id: task.id,
      application_id: task.application_id,
      title: task.title,
      description: task.description,
      due_at: task.due_at,
      priority: task.priority,
      completed_at: task.completed_at,
      overdue: overdue?,
      created_at: task.created_at,
      updated_at: task.updated_at
    }

    return data unless include_application

    data.merge(application: serialized_application)
  end

  private

  attr_reader :task, :include_application

  def overdue?
    task.due_at.present? &&
      task.completed_at.blank? &&
      task.due_at < Time.current
  end

  def serialized_application
    {
      id: application.id,
      job_posting: {
        id: job_posting.id,
        title: job_posting.title,
        company: CompanySerializer
          .new(job_posting.company, summary: true)
          .serializable_hash
      }
    }
  end

  def application
    task.application
  end

  def job_posting
    application.job_posting
  end
end
