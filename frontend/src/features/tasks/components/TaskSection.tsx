import { useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '../../../shared/api/apiError'
import { ContentLoading } from '../../../shared/components/ContentLoading'
import { InlineAlert } from '../../../shared/components/InlineAlert'
import { tasksApi } from '../api/tasksApi'
import {
  emptyTaskFormValues,
  toTaskFormValues,
  type Task,
  type TaskInput,
} from '../types'
import { TaskForm } from './TaskForm'
import { TaskList } from './TaskList'

type TaskSectionProps = {
  applicationId: number
  onTaskCountChange?: (count: number) => void
}

const sortTasks = (tasks: Task[]): Task[] =>
  [...tasks].sort((left, right) => {
    if (left.completed_at === null && right.completed_at !== null) {
      return -1
    }
    if (left.completed_at !== null && right.completed_at === null) {
      return 1
    }
    if (left.due_at === null && right.due_at !== null) {
      return 1
    }
    if (left.due_at !== null && right.due_at === null) {
      return -1
    }
    if (left.due_at && right.due_at) {
      const dueDifference =
        new Date(left.due_at).getTime() - new Date(right.due_at).getTime()
      if (dueDifference !== 0) {
        return dueDifference
      }
    }
    return left.id - right.id
  })

export function TaskSection({
  applicationId,
  onTaskCountChange,
}: TaskSectionProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const updatingTaskIdsRef = useRef<Set<number>>(new Set())
  const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<number>>(
    () => new Set(),
  )
  const [deleteConfirmTaskId, setDeleteConfirmTaskId] = useState<number | null>(
    null,
  )

  useEffect(() => {
    let active = true

    const fetchTasks = async () => {
      try {
        const loadedTasks = await tasksApi.list(applicationId)
        if (active) {
          const sortedTasks = sortTasks(loadedTasks)
          setTasks(sortedTasks)
          setErrorMessage('')
        }
      } catch (error) {
        if (active) {
          setErrorMessage(getApiErrorMessage(error))
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void fetchTasks()
    return () => {
      active = false
    }
  }, [applicationId, onTaskCountChange, reloadKey])

  useEffect(() => {
    if (!isLoading && !errorMessage) {
      onTaskCountChange?.(tasks.length)
    }
  }, [errorMessage, isLoading, onTaskCountChange, tasks.length])

  const beginTaskUpdate = (taskId: number): boolean => {
    if (updatingTaskIdsRef.current.has(taskId)) {
      return false
    }

    const nextIds = new Set(updatingTaskIdsRef.current)
    nextIds.add(taskId)
    updatingTaskIdsRef.current = nextIds
    setUpdatingTaskIds(nextIds)
    return true
  }

  const finishTaskUpdate = (taskId: number) => {
    const nextIds = new Set(updatingTaskIdsRef.current)
    nextIds.delete(taskId)
    updatingTaskIdsRef.current = nextIds
    setUpdatingTaskIds(nextIds)
  }

  const replaceTask = (updatedTask: Task) => {
    setTasks((current) =>
      sortTasks(
        current.map((task) =>
          task.id === updatedTask.id ? updatedTask : task,
        ),
      ),
    )
  }

  const handleCreate = async (input: TaskInput) => {
    const createdTask = await tasksApi.create(applicationId, input)
    setTasks((current) => sortTasks([...current, createdTask]))
    setIsCreating(false)
  }

  const handleUpdate = async (input: TaskInput) => {
    const task = editingTask
    if (!task || !beginTaskUpdate(task.id)) {
      return
    }

    try {
      const updatedTask = await tasksApi.update(task.id, input)
      replaceTask(updatedTask)
      setEditingTask(null)
    } finally {
      finishTaskUpdate(task.id)
    }
  }

  const handleToggleCompleted = async (task: Task) => {
    if (!beginTaskUpdate(task.id)) {
      return
    }

    setActionError('')

    try {
      const updatedTask = await tasksApi.update(task.id, {
        completed: task.completed_at === null,
      })
      replaceTask(updatedTask)
    } catch (error) {
      setActionError(getApiErrorMessage(error))
    } finally {
      finishTaskUpdate(task.id)
    }
  }

  const handleDelete = async (task: Task) => {
    if (!beginTaskUpdate(task.id)) {
      return
    }

    setActionError('')

    try {
      await tasksApi.destroy(task.id)
      setTasks((current) =>
        current.filter((currentTask) => currentTask.id !== task.id),
      )
      setDeleteConfirmTaskId(null)
      if (editingTask?.id === task.id) {
        setEditingTask(null)
      }
    } catch (error) {
      setActionError(getApiErrorMessage(error))
      setDeleteConfirmTaskId(null)
    } finally {
      finishTaskUpdate(task.id)
    }
  }

  const handleReload = () => {
    setIsLoading(true)
    setErrorMessage('')
    setReloadKey((current) => current + 1)
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">タスク</h2>
          <p className="mt-1 text-sm text-slate-500">
            応募に必要な作業と期限を管理します。
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingTask(null)
            setIsCreating(true)
            setActionError('')
          }}
          disabled={
            isLoading ||
            errorMessage !== '' ||
            isCreating ||
            editingTask !== null
          }
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          タスクを追加
        </button>
      </div>

      <div className="mt-5">
        {actionError && (
          <div className="mb-4">
            <InlineAlert message={actionError} />
          </div>
        )}

        {isCreating && (
          <TaskForm
            key="new-task"
            initialValues={emptyTaskFormValues}
            submitLabel="タスクを追加"
            onSubmit={handleCreate}
            onCancel={() => setIsCreating(false)}
          />
        )}

        {editingTask && (
          <TaskForm
            key={editingTask.id}
            initialValues={toTaskFormValues(editingTask)}
            submitLabel="変更を保存"
            onSubmit={handleUpdate}
            onCancel={() => setEditingTask(null)}
          />
        )}

        {(isCreating || editingTask) && <div className="h-5" />}

        {isLoading && <ContentLoading message="タスクを読み込み中..." />}

        {!isLoading && errorMessage && (
          <div className="space-y-4">
            <InlineAlert message={errorMessage} />
            <button
              type="button"
              onClick={handleReload}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              再読み込み
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && (
          <TaskList
            tasks={tasks}
            updatingTaskIds={updatingTaskIds}
            deleteConfirmTaskId={deleteConfirmTaskId}
            onToggleCompleted={handleToggleCompleted}
            onEdit={(task) => {
              setIsCreating(false)
              setEditingTask(task)
              setActionError('')
            }}
            onRequestDelete={setDeleteConfirmTaskId}
            onCancelDelete={() => setDeleteConfirmTaskId(null)}
            onDelete={handleDelete}
          />
        )}
      </div>
    </section>
  )
}
