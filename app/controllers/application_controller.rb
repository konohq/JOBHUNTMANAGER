class ApplicationController < ActionController::API
  rescue_from ActionController::ParameterMissing,
              with: :render_bad_request

  protected

  def authenticate_user_with_json!
    return if current_user

    render json: {
      error: {
        code: "unauthorized",
        message: "認証が必要です"
      }
    }, status: :unauthorized
  end

  def render_validation_errors(record)
    render json: {
      error: {
        code: "validation_error",
        message: "入力内容を確認してください",
        details: record.errors.to_hash(true)
      }
    }, status: :unprocessable_entity
  end

  def render_bad_request
    render json: {
      error: {
        code: "bad_request",
        message: "リクエスト形式が正しくありません"
      }
    }, status: :bad_request
  end
end
