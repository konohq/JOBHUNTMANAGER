module Api
  module V1
    class CompaniesController < BaseController
      def index
        companies = current_user.companies.order(:name, :id)

        render json: {
          data: companies.map do |company|
            CompanySerializer.new(company, summary: true).serializable_hash
          end
        }, status: :ok
      end

      def create
        company = current_user.companies.build(company_params)

        if company.save
          render json: {
            data: CompanySerializer.new(company).serializable_hash
          }, status: :created
        else
          render_validation_errors(company)
        end
      end

      private

      def company_params
        params.require(:company).permit(
          :name,
          :website_url,
          :industry,
          :location,
          :description
        )
      end
    end
  end
end
