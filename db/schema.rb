# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_06_19_000007) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "applications", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "job_posting_id", null: false
    t.integer "status", default: 0, null: false
    t.date "applied_on", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["job_posting_id"], name: "index_applications_on_job_posting_id", unique: true
    t.index ["user_id", "status", "updated_at"], name: "index_applications_on_user_id_and_status_and_updated_at"
    t.index ["user_id"], name: "index_applications_on_user_id"
  end

  create_table "companies", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "name", null: false
    t.string "website_url"
    t.string "industry"
    t.string "location"
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "name"], name: "index_companies_on_user_id_and_name"
    t.index ["user_id"], name: "index_companies_on_user_id"
  end

  create_table "interviews", force: :cascade do |t|
    t.bigint "application_id", null: false
    t.integer "interview_type", default: 0, null: false
    t.datetime "scheduled_at", null: false
    t.string "location"
    t.string "meeting_url"
    t.integer "status", default: 0, null: false
    t.integer "result", default: 0, null: false
    t.string "interviewer"
    t.text "details"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["application_id"], name: "index_interviews_on_application_id"
    t.index ["scheduled_at"], name: "index_interviews_on_scheduled_at"
  end

  create_table "job_postings", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "company_id", null: false
    t.string "title", null: false
    t.string "employment_type"
    t.string "location"
    t.string "source_url"
    t.text "description"
    t.date "application_deadline"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_job_postings_on_company_id"
    t.index ["user_id"], name: "index_job_postings_on_user_id"
  end

  create_table "notes", force: :cascade do |t|
    t.bigint "application_id", null: false
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["application_id", "created_at"], name: "index_notes_on_application_id_and_created_at"
    t.index ["application_id"], name: "index_notes_on_application_id"
  end

  create_table "tasks", force: :cascade do |t|
    t.bigint "application_id", null: false
    t.string "title", null: false
    t.text "description"
    t.datetime "due_at"
    t.integer "priority", default: 1, null: false
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["application_id"], name: "index_tasks_on_application_id"
    t.index ["completed_at", "due_at"], name: "index_tasks_on_completed_at_and_due_at"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "jti", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["jti"], name: "index_users_on_jti", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "applications", "job_postings", on_delete: :restrict
  add_foreign_key "applications", "users", on_delete: :restrict
  add_foreign_key "companies", "users", on_delete: :restrict
  add_foreign_key "interviews", "applications", on_delete: :cascade
  add_foreign_key "job_postings", "companies", on_delete: :restrict
  add_foreign_key "job_postings", "users", on_delete: :restrict
  add_foreign_key "notes", "applications", on_delete: :cascade
  add_foreign_key "tasks", "applications", on_delete: :cascade
end
