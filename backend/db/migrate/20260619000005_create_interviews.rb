# frozen_string_literal: true

class CreateInterviews < ActiveRecord::Migration[8.0]
  def change
    create_table :interviews do |t|
      t.references :application,
                   null: false,
                   foreign_key: { on_delete: :cascade }
      t.integer :interview_type, null: false, default: 0
      t.datetime :scheduled_at, null: false
      t.string :location
      t.string :meeting_url
      t.integer :status, null: false, default: 0
      t.integer :result, null: false, default: 0
      t.string :interviewer
      t.text :details

      t.timestamps
    end

    add_index :interviews, :scheduled_at
  end
end
