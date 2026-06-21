class UserSerializer
  def initialize(user)
    @user = user
  end

  def serializable_hash
    {
      id: user.id,
      name: user.name,
      email: user.email
    }
  end

  private

  attr_reader :user
end
