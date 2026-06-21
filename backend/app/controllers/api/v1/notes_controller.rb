module Api
  module V1
    class NotesController < BaseController
      before_action :set_application, only: %i[index create]
      before_action :set_note, only: %i[update destroy]

      def index
        notes = @application.notes.order(created_at: :desc, id: :desc)

        render json: {
          data: notes.map do |note|
            NoteSerializer.new(note).serializable_hash
          end
        }, status: :ok
      end

      def create
        note = @application.notes.build(note_params)

        if note.save
          render json: {
            data: NoteSerializer.new(note).serializable_hash
          }, status: :created
        else
          render_validation_errors(note)
        end
      end

      def update
        if @note.update(note_params)
          render json: {
            data: NoteSerializer.new(@note).serializable_hash
          }, status: :ok
        else
          render_validation_errors(@note)
        end
      end

      def destroy
        if @note.destroy
          head :no_content
        else
          @note.errors.add(:base, "メモの削除に失敗しました") \
            if @note.errors.empty?
          render_validation_errors(@note)
        end
      end

      private

      def set_application
        @application = current_user.applications.find(params[:application_id])
      end

      def set_note
        @note = Note
          .joins(:application)
          .where(applications: { user_id: current_user.id })
          .find(params[:id])
      end

      def note_params
        params.require(:note).permit(:content)
      end
    end
  end
end
