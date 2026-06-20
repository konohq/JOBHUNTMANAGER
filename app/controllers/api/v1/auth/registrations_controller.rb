module Api
  module V1
    module Auth
      class RegistrationsController < Devise::RegistrationsController
        respond_to :json

        def create
          build_resource(sign_up_params)

          if resource.save
            sign_in(resource_name, resource, store: false)

            render json: {
              data: UserSerializer.new(resource).serializable_hash
            }, status: :created
          else
            clean_up_passwords(resource)
            render_validation_errors(resource)
          end
        end

        private

        def sign_up_params
          params.require(:user).permit(
            :name,
            :email,
            :password,
            :password_confirmation
          )
        end
      end
    end
  end
end
