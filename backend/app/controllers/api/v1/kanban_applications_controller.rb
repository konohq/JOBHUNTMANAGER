module Api
  module V1
    class KanbanApplicationsController < BaseController
      def create
        creator = ::KanbanApplicationCreator.new(
          user: current_user,
          attributes: kanban_application_params.to_h
        )

        if creator.save
          render json: {
            data: ::KanbanCardSerializer
              .new(creator.application)
              .serializable_hash
          }, status: :created
        else
          render_validation_errors(creator)
        end
      end

      private

      def kanban_application_params
        params.require(:application).permit(
          :company_name,
          :applied_on
        )
      end
    end
  end
end
