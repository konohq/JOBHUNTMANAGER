# frozen_string_literal: true

class CreateApplications < ActiveRecord::Migration[8.0]
  def change
    create_table :applications do |t|
      t.references :user, null: false, foreign_key: { on_delete: :restrict }
      t.references :job_posting,
                   null: false,
                   foreign_key: { on_delete: :restrict },
                   index: { unique: true }
      t.integer :status, null: false, default: 0
      t.date :applied_on, null: false

      t.timestamps
    end

    add_index :applications, %i[user_id status updated_at]
  end
end
