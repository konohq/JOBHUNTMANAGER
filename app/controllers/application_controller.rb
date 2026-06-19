class ApplicationController < ActionController::API
  rescue_from ActionController::ParameterMissing,
              with: :render_bad_request

  private

  def render_bad_request
    render json: {
      error: {
        code: "bad_request",
        message: "リクエスト形式が正しくありません"
      }
    }, status: :bad_request
  end
end
