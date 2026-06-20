module Api
  module V1
    class BaseController < ApplicationController
      before_action :authenticate_user_with_json!
    end
  end
end
