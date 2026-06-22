export const taskPriorityLabels = {
  low: '低',
  medium: '中',
  high: '高',
} as const

export type TaskPriority = keyof typeof taskPriorityLabels

export type Task = {
  id: number
  application_id: number
  title: string
  description: string | null
  due_at: string | null
  priority: TaskPriority
  completed_at: string | null
  overdue: boolean
  created_at: string
  updated_at: string
}

export type TaskInput = {
  title: string
  description: string
  due_at: string
  priority: TaskPriority
}

export type UpdateTaskInput = Partial<TaskInput> & {
  completed?: boolean
}

export type TaskFormValues = {
  title: string
  description: string
  dueAt: string
  priority: TaskPriority
}

export const emptyTaskFormValues: TaskFormValues = {
  title: '',
  description: '',
  dueAt: '',
  priority: 'medium',
}

export const toTaskFormValues = (task: Task): TaskFormValues => ({
  title: task.title,
  description: task.description ?? '',
  dueAt: toDateTimeLocalValue(task.due_at),
  priority: task.priority,
})

export const toTaskInput = (values: TaskFormValues): TaskInput => ({
  title: values.title.trim(),
  description: values.description.trim(),
  due_at: values.dueAt ? new Date(values.dueAt).toISOString() : '',
  priority: values.priority,
})

const toDateTimeLocalValue = (value: string | null): string => {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  )
  return localDate.toISOString().slice(0, 16)
}
