module Api
  module V1
    class InterviewsController < BaseController
      before_action :set_application, only: %i[index create]
      before_action :set_interview, only: %i[update destroy]

      def index
        interviews = if @application
          @application.interviews.order(:scheduled_at, :id)
        else
          current_user_interviews
        end

        render json: {
          data: interviews.map do |interview|
            InterviewSerializer
              .new(interview, include_application: @application.nil?)
              .serializable_hash
          end
        }, status: :ok
      end

      def create
        interview = @application.interviews.build(interview_params)

        if interview.save
          render json: {
            data: InterviewSerializer.new(interview).serializable_hash
          }, status: :created
        else
          render_validation_errors(interview)
        end
      end

      def update
        if @interview.update(interview_params)
          render json: {
            data: InterviewSerializer.new(@interview).serializable_hash
          }, status: :ok
        else
          render_validation_errors(@interview)
        end
      end

      def destroy
        if @interview.destroy
          head :no_content
        else
          @interview.errors.add(:base, "面接の削除に失敗しました") \
            if @interview.errors.empty?
          render_validation_errors(@interview)
        end
      end

      private

      def set_application
        return unless params[:application_id]

        @application = current_user.applications.find(params[:application_id])
      end

      def current_user_interviews
        Interview
          .joins(:application)
          .where(applications: { user_id: current_user.id })
          .includes(application: { job_posting: :company })
          .order(:scheduled_at, :id)
      end

      def set_interview
        @interview = Interview
          .joins(:application)
          .where(applications: { user_id: current_user.id })
          .find(params[:id])
      end

      def interview_params
        params.require(:interview).permit(
          :interview_type,
          :scheduled_at,
          :location,
          :meeting_url,
          :status,
          :result,
          :interviewer,
          :details
        )
      end
    end
  end
end
