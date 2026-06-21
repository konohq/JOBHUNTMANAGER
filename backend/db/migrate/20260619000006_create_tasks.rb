# frozen_string_literal: true

class CreateTasks < ActiveRecord::Migration[8.0]
  def change
    create_table :tasks do |t|
      t.references :application,
                   null: false,
                   foreign_key: { on_delete: :cascade }
      t.string :title, null: false
      t.text :description
      t.datetime :due_at
      t.integer :priority, null: false, default: 1
      t.datetime :completed_at

      t.timestamps
    end

    add_index :tasks, %i[completed_at due_at]
  end
end
