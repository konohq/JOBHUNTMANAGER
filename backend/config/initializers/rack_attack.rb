# frozen_string_literal: true

class Rack::Attack
  LOGIN_LIMIT = 5
  LOGIN_PERIOD = 1.minute
  SIGN_UP_LIMIT = 3
  SIGN_UP_PERIOD = 1.hour

  Rack::Attack.enabled = !Rails.env.test?
  Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new
  Rack::Attack.throttled_response_retry_after_header = true

  throttle(
    "authentication/sign_in/ip",
    limit: LOGIN_LIMIT,
    period: LOGIN_PERIOD
  ) do |request|
    request.ip if request.post? &&
      request.path.match?(%r{\A/api/v1/auth/sign_in(?:\.json)?\z})
  end

  throttle(
    "authentication/sign_up/ip",
    limit: SIGN_UP_LIMIT,
    period: SIGN_UP_PERIOD
  ) do |request|
    request.ip if request.post? &&
      request.path.match?(%r{\A/api/v1/auth(?:\.json)?\z})
  end

  self.throttled_responder = lambda do |request|
    match_data = request.env.fetch("rack.attack.match_data")
    period = match_data.fetch(:period)
    epoch_time = match_data.fetch(:epoch_time)
    retry_after = period - (epoch_time % period)

    body = {
      error: {
        code: "rate_limit_exceeded",
        message: "リクエスト回数が上限を超えました。時間をおいて再度お試しください"
      }
    }

    [
      429,
      {
        "Content-Type" => "application/json; charset=utf-8",
        "Retry-After" => retry_after.to_s
      },
      [ JSON.generate(body) ]
    ]
  end
end
