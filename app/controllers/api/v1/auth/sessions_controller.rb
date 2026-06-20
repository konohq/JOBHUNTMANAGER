module Api
  module V1
    module Auth
      class SessionsController < Devise::SessionsController
        respond_to :json

        skip_before_action :verify_signed_out_user, only: :destroy
        before_action :authenticate_user_with_json!, only: %i[show destroy]

        def create
          self.resource = warden.authenticate(auth_options)

          unless resource
            return render json: {
              error: {
                code: "invalid_credentials",
                message: "メールアドレスまたはパスワードが正しくありません"
              }
            }, status: :unauthorized
          end

          sign_in(resource_name, resource, store: false)

          render json: {
            data: UserSerializer.new(resource).serializable_hash
          }, status: :ok
        end

        def show
          render json: {
            data: UserSerializer.new(current_user).serializable_hash
          }, status: :ok
        end

        def destroy
          head :no_content
        end
      end
    end
  end
end
