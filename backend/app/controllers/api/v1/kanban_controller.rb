module Api
  module V1
    class KanbanController < BaseController
      def show
        applications = current_user
          .applications
          .includes(job_posting: :company)
          .order(:status, updated_at: :desc, id: :desc)

        grouped_applications = Application.statuses.keys.index_with { [] }
        applications.each do |application|
          grouped_applications.fetch(application.status) <<
            KanbanCardSerializer.new(application).serializable_hash
        end

        render json: { data: grouped_applications }, status: :ok
      end
    end
  end
end
