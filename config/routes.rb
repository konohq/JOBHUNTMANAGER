Rails.application.routes.draw do
  devise_for :users,
             path: "api/v1/auth",
             skip: :all,
             controllers: {
               registrations: "api/v1/auth/registrations",
               sessions: "api/v1/auth/sessions"
             }

  devise_scope :user do
    post "api/v1/auth", to: "api/v1/auth/registrations#create"
    post "api/v1/auth/sign_in", to: "api/v1/auth/sessions#create"
    delete "api/v1/auth/sign_out", to: "api/v1/auth/sessions#destroy"
    get "api/v1/auth/me", to: "api/v1/auth/sessions#show"
  end

  get "up" => "rails/health#show", as: :rails_health_check
end
