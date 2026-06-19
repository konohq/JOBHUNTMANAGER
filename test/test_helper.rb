ENV["RAILS_ENV"] ||= "test"
ENV["DEVISE_JWT_SECRET_KEY"] ||= "test-jwt-secret-key-for-job-hunt-manager"

require_relative "../config/environment"
require "rails/test_help"
require "devise/jwt/test_helpers"

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors, with: :threads)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all

    # Add more helper methods to be used by all tests here...
  end
end
