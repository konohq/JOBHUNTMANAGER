# frozen_string_literal: true

class CreateJobPostings < ActiveRecord::Migration[8.0]
  def change
    create_table :job_postings do |t|
      t.references :user, null: false, foreign_key: { on_delete: :restrict }
      t.references :company, null: false, foreign_key: { on_delete: :restrict }
      t.string :title, null: false
      t.string :employment_type
      t.string :location
      t.string :source_url
      t.text :description
      t.date :application_deadline

      t.timestamps
    end
  end
end
