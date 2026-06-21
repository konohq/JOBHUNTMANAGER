class InterviewSerializer
  def initialize(interview, include_application: false)
    @interview = interview
    @include_application = include_application
  end

  def serializable_hash
    data = {
      id: interview.id,
      application_id: interview.application_id,
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

    return data unless include_application

    data.merge(application: serialized_application)
  end

  private

  attr_reader :interview, :include_application

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
    interview.application
  end

  def job_posting
    application.job_posting
  end
end
