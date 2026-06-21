module Api
  module V1
    class ApplicationsController < BaseController
      before_action :set_application, only: %i[show update destroy]

      def index
        applications = current_user
          .applications
          .includes(job_posting: :company)
          .order(:status, updated_at: :desc, id: :desc)

        render json: {
          data: applications.map do |application|
            ApplicationSerializer.new(application).serializable_hash
          end
        }, status: :ok
      end

      def show
        render_application(detail: true)
      end

      def create
        job_posting = find_job_posting(
          create_application_params[:job_posting_id]
        )
        application = current_user.applications.build(
          create_application_params
            .except(:job_posting_id)
            .merge(job_posting: job_posting)
        )

        if application.save
          render json: {
            data: ApplicationSerializer.new(application).serializable_hash
          }, status: :created
        else
          render_validation_errors(application)
        end
      rescue ActiveRecord::RecordNotUnique
        application.errors.add(:job_posting_id, :taken)
        render_validation_errors(application)
      end

      def update
        if @application.update(update_application_params)
          render_application
        else
          render_validation_errors(@application)
        end
      end

      def destroy
        if @application.destroy
          head :no_content
        else
          @application.errors.add(:base, "応募の削除に失敗しました") \
            if @application.errors.empty?
          render_validation_errors(@application)
        end
      end

      private

      def set_application
        @application = current_user
          .applications
          .includes(
            { job_posting: :company },
            :interviews,
            :tasks,
            :notes
          )
          .find(params[:id])
      end

      def create_application_params
        params.require(:application).permit(
          :job_posting_id,
          :status,
          :applied_on
        )
      end

      def update_application_params
        params.require(:application).permit(
          :status,
          :applied_on
        )
      end

      def find_job_posting(job_posting_id)
        return if job_posting_id.blank?

        current_user
          .job_postings
          .includes(:company)
          .find(job_posting_id)
      end

      def render_application(detail: false)
        render json: {
          data: ApplicationSerializer
            .new(@application, detail: detail)
            .serializable_hash
        }, status: :ok
      end
    end
  end
end
