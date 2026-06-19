Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ENV.fetch("FRONTEND_ORIGIN", "http://localhost:5173")

    resource "*",
      headers: %w[Authorization Content-Type Accept],
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
      expose: %w[Authorization]
  end
end
