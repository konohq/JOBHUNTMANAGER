import {
  taskPriorityLabels,
  type Task,
} from '../types'

type TaskListProps = {
  tasks: Task[]
  updatingTaskIds: Set<number>
  deleteConfirmTaskId: number | null
  onToggleCompleted: (task: Task) => Promise<void>
  onEdit: (task: Task) => void
  onRequestDelete: (taskId: number) => void
  onCancelDelete: () => void
  onDelete: (task: Task) => Promise<void>
}

const priorityClasses = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
} as const

const dueAtFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const formatDueAt = (value: string): string => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : dueAtFormatter.format(date)
}

export function TaskList({
  tasks,
  updatingTaskIds,
  deleteConfirmTaskId,
  onToggleCompleted,
  onEdit,
  onRequestDelete,
  onCancelDelete,
  onDelete,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
        タスクはまだありません。
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {tasks.map((task) => {
        const isCompleted = task.completed_at !== null
        const isUpdating = updatingTaskIds.has(task.id)
        const isDeleteConfirming = deleteConfirmTaskId === task.id

        return (
          <li
            key={task.id}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={isCompleted}
                disabled={isUpdating}
                onChange={() => void onToggleCompleted(task)}
                aria-label={`${task.title}を${isCompleted ? '未完了' : '完了'}にする`}
                className="mt-1 size-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className={[
                      'font-semibold',
                      isCompleted
                        ? 'text-slate-400 line-through'
                        : 'text-slate-900',
                    ].join(' ')}
                  >
                    {task.title}
                  </h3>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClasses[task.priority]}`}
                  >
                    優先度: {taskPriorityLabels[task.priority]}
                  </span>
                  {task.overdue && (
                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                      期限超過
                    </span>
                  )}
                  {isCompleted && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      完了
                    </span>
                  )}
                </div>

                {task.description && (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {task.description}
                  </p>
                )}

                <p className="mt-2 text-xs text-slate-500">
                  期限: {task.due_at ? formatDueAt(task.due_at) : '未設定'}
                </p>
              </div>
            </div>

            {isDeleteConfirming ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-700">
                  このタスクを削除しますか？
                </p>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onCancelDelete}
                    disabled={isUpdating}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDelete(task)}
                    disabled={isUpdating}
                    className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {isUpdating ? '削除中...' : '削除する'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => onEdit(task)}
                  disabled={isUpdating}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => onRequestDelete(task.id)}
                  disabled={isUpdating}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  削除
                </button>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
