module Api
  module V1
    class JobPostingsController < BaseController
      before_action :set_job_posting, only: %i[show update destroy]

      def index
        job_postings = current_user
          .job_postings
          .includes(:company, :application)
          .order(created_at: :desc, id: :desc)

        render json: {
          data: job_postings.map do |job_posting|
            JobPostingSerializer
              .new(job_posting, summary: true)
              .serializable_hash
          end
        }, status: :ok
      end

      def show
        render_job_posting
      end

      def create
        company = find_company(job_posting_params[:company_id])
        job_posting = current_user.job_postings.build(
          job_posting_attributes.merge(company: company)
        )

        if job_posting.save
          render json: {
            data: JobPostingSerializer.new(job_posting).serializable_hash
          }, status: :created
        else
          render_validation_errors(job_posting)
        end
      end

      def update
        company = find_company_for_update
        @job_posting.assign_attributes(
          job_posting_attributes.merge(company: company)
        )

        if @job_posting.save
          render_job_posting
        else
          render_validation_errors(@job_posting)
        end
      end

      def destroy
        if @job_posting.destroy
          head :no_content
        else
          render_dependent_exists(
            "応募が登録されている求人は削除できません"
          )
        end
      end

      private

      def set_job_posting
        @job_posting = current_user
          .job_postings
          .includes(:company, :application)
          .find(params[:id])
      end

      def job_posting_params
        params.require(:job_posting).permit(
          :company_id,
          :title,
          :employment_type,
          :location,
          :source_url,
          :description,
          :application_deadline
        )
      end

      def job_posting_attributes
        job_posting_params.except(:company_id)
      end

      def find_company_for_update
        return @job_posting.company unless job_posting_params.key?(:company_id)

        find_company(job_posting_params[:company_id])
      end

      def find_company(company_id)
        return if company_id.blank?

        current_user.companies.find(company_id)
      end

      def render_job_posting
        render json: {
          data: JobPostingSerializer.new(@job_posting).serializable_hash
        }, status: :ok
      end
    end
  end
end
