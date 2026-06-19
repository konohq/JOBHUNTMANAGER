# frozen_string_literal: true

class CreateNotes < ActiveRecord::Migration[8.0]
  def change
    create_table :notes do |t|
      t.references :application,
                   null: false,
                   foreign_key: { on_delete: :cascade }
      t.text :body, null: false

      t.timestamps
    end

    add_index :notes, %i[application_id created_at]
  end
end
