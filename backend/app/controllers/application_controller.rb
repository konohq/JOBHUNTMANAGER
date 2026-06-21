class ApplicationController < ActionController::API
  rescue_from ActionController::ParameterMissing,
              with: :render_bad_request
  rescue_from ActiveRecord::RecordNotFound,
              with: :render_not_found

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

  def render_not_found
    render json: {
      error: {
        code: "not_found",
        message: "対象のデータが見つかりません"
      }
    }, status: :not_found
  end

  def render_dependent_exists(message)
    render json: {
      error: {
        code: "dependent_exists",
        message: message
      }
    }, status: :unprocessable_entity
  end
end
