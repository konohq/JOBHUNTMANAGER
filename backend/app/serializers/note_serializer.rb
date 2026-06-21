class NoteSerializer
  def initialize(note)
    @note = note
  end

  def serializable_hash
    {
      id: note.id,
      application_id: note.application_id,
      content: note.content,
      created_at: note.created_at,
      updated_at: note.updated_at
    }
  end

  private

  attr_reader :note
end
