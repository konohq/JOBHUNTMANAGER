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

  namespace :api do
    namespace :v1 do
      resources :companies, only: %i[index create]
      resources :job_postings
      resources :applications do
        resources :interviews, only: :create
        resources :tasks, only: %i[index create]
        resources :notes, only: %i[index create]
      end
      resources :interviews, only: %i[index update destroy]
      resources :tasks, only: %i[index update destroy]
      resources :notes, only: %i[update destroy]
      resource :kanban, only: :show, controller: "kanban"
      post "kanban/applications",
           to: "kanban_applications#create",
           as: :kanban_applications
      patch "applications/:application_id/status",
            to: "application_statuses#update",
            as: :application_status
    end
  end

  get "up" => "rails/health#show", as: :rails_health_check
end
