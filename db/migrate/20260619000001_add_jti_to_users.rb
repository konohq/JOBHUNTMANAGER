# frozen_string_literal: true

class AddJtiToUsers < ActiveRecord::Migration[8.0]
  class MigrationUser < ActiveRecord::Base
    self.table_name = "users"
  end

  def up
    add_column :users, :jti, :string

    MigrationUser.reset_column_information
    MigrationUser.find_each do |user|
      user.update_columns(jti: SecureRandom.uuid)
    end

    change_column_null :users, :jti, false
    add_index :users, :jti, unique: true
  end

  def down
    remove_index :users, :jti
    remove_column :users, :jti
  end
end
