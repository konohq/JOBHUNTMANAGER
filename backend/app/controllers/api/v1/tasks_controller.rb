module Api
  module V1
    class TasksController < BaseController
      before_action :set_application, only: :create
      before_action :set_task, only: %i[update destroy]

      def index
        tasks = Task
          .joins(:application)
          .where(applications: { user_id: current_user.id })
          .includes(application: { job_posting: :company })
          .order(:completed_at, :due_at, :id)

        render json: {
          data: tasks.map do |task|
            TaskSerializer
              .new(task, include_application: true)
              .serializable_hash
          end
        }, status: :ok
      end

      def create
        task = @application.tasks.build(task_attributes)

        if assign_completion(task) && task.save
          render json: {
            data: TaskSerializer.new(task).serializable_hash
          }, status: :created
        else
          render_validation_errors(task)
        end
      end

      def update
        @task.assign_attributes(task_attributes)

        if assign_completion(@task) && @task.save
          render json: {
            data: TaskSerializer.new(@task).serializable_hash
          }, status: :ok
        else
          render_validation_errors(@task)
        end
      end

      def destroy
        if @task.destroy
          head :no_content
        else
          @task.errors.add(:base, "タスクの削除に失敗しました") \
            if @task.errors.empty?
          render_validation_errors(@task)
        end
      end

      private

      def set_application
        @application = current_user.applications.find(params[:application_id])
      end

      def set_task
        @task = Task
          .joins(:application)
          .where(applications: { user_id: current_user.id })
          .find(params[:id])
      end

      def task_params
        @task_params ||= params.require(:task).permit(
          :title,
          :description,
          :due_at,
          :priority,
          :completed
        )
      end

      def task_attributes
        task_params.except(:completed)
      end

      def assign_completion(task)
        return true unless task_params.key?(:completed)

        completed = task_params[:completed]
        unless [ true, false ].include?(completed)
          task.errors.add(
            :completed,
            "はtrueまたはfalseを指定してください"
          )
          return false
        end

        task.completed_at = completed ? Time.current : nil
        true
      end
    end
  end
end
