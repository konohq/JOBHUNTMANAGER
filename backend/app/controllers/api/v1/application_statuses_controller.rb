module Api
  module V1
    class ApplicationStatusesController < BaseController
      before_action :set_application

      def update
        if @application.update(status_params)
          render json: {
            data: KanbanCardSerializer.new(@application).serializable_hash
          }, status: :ok
        else
          render_validation_errors(@application)
        end
      end

      private

      def set_application
        @application = current_user
          .applications
          .includes(job_posting: :company)
          .find(params[:application_id])
      end

      def status_params
        params.require(:application).permit(:status)
      end
    end
  end
end
