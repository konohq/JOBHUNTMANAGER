class ApplicationSerializer
  def initialize(application, detail: false)
    @application = application
    @detail = detail
  end

  def serializable_hash
    return summary_hash unless detail

    summary_hash.merge(
      job_posting: detailed_job_posting,
      interviews: serialized_interviews,
      tasks: serialized_tasks,
      notes: serialized_notes
    )
  end

  private

  attr_reader :application, :detail

  def summary_hash
    {
      id: application.id,
      status: application.status,
      applied_on: application.applied_on,
      job_posting: summarized_job_posting,
      created_at: application.created_at,
      updated_at: application.updated_at
    }
  end

  def summarized_job_posting
    {
      id: job_posting.id,
      title: job_posting.title,
      company: serialized_company
    }
  end

  def detailed_job_posting
    summarized_job_posting.merge(
      employment_type: job_posting.employment_type,
      location: job_posting.location,
      source_url: job_posting.source_url,
      application_deadline: job_posting.application_deadline
    )
  end

  def serialized_company
    CompanySerializer
      .new(job_posting.company, summary: true)
      .serializable_hash
  end

  def serialized_interviews
    application.interviews
      .sort_by { |interview| interview_sort_key(interview) }
      .map do |interview|
        {
          id: interview.id,
          interview_type: interview.interview_type,
          scheduled_at: interview.scheduled_at,
          location: interview.location,
          meeting_url: interview.meeting_url,
          status: interview.status,
          result: interview.result,
          interviewer: interview.interviewer,
          details: interview.details,
          created_at: interview.created_at,
          updated_at: interview.updated_at
        }
      end
  end

  def serialized_tasks
    application.tasks
      .sort_by { |task| task_sort_key(task) }
      .map do |task|
        {
          id: task.id,
          title: task.title,
          description: task.description,
          due_at: task.due_at,
          priority: task.priority,
          completed_at: task.completed_at,
          created_at: task.created_at,
          updated_at: task.updated_at
        }
      end
  end

  def serialized_notes
    application.notes
      .sort_by { |note| note_sort_key(note) }
      .reverse
      .map do |note|
        {
          id: note.id,
          content: note.content,
          created_at: note.created_at,
          updated_at: note.updated_at
        }
      end
  end

  def job_posting
    application.job_posting
  end

  def interview_sort_key(interview)
    [ interview.scheduled_at, interview.id ]
  end

  def task_sort_key(task)
    [
      task.completed_at.present? ? 1 : 0,
      task.due_at || Time.zone.at(0),
      task.id
    ]
  end

  def note_sort_key(note)
    [ note.created_at, note.id ]
  end
end
