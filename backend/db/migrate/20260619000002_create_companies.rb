# frozen_string_literal: true

class CreateCompanies < ActiveRecord::Migration[8.0]
  def change
    create_table :companies do |t|
      t.references :user, null: false, foreign_key: { on_delete: :restrict }
      t.string :name, null: false
      t.string :website_url
      t.string :industry
      t.string :location
      t.text :description

      t.timestamps
    end

    add_index :companies, %i[user_id name]
  end
end
