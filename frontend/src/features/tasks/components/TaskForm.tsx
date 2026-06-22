import { useState, type FormEvent } from 'react'
import {
  getApiErrorMessage,
  getApiValidationErrors,
} from '../../../shared/api/apiError'
import { InlineAlert } from '../../../shared/components/InlineAlert'
import {
  taskPriorityLabels,
  toTaskInput,
  type TaskFormValues,
  type TaskInput,
  type TaskPriority,
} from '../types'

type TaskFormProps = {
  initialValues: TaskFormValues
  submitLabel: string
  onSubmit: (input: TaskInput) => Promise<void>
  onCancel: () => void
}

const inputClassName =
  'mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'

export function TaskForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const [values, setValues] = useState(initialValues)
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateValue = (
    field: keyof TaskFormValues,
    value: string,
  ) => {
    setValues((current) => ({ ...current, [field]: value }))
    const errorField = field === 'dueAt' ? 'due_at' : field
    setFieldErrors((current) => ({ ...current, [errorField]: [] }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      await onSubmit(toTaskInput(values))
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
      setFieldErrors(getApiValidationErrors(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const fieldError = (...fields: string[]) =>
    fields.flatMap((field) => fieldErrors[field] ?? []).join('、')

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5"
    >
      {errorMessage && <InlineAlert message={errorMessage} />}

      <div className="mt-1 grid gap-5 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            タスク名 <span className="text-red-500">*</span>
          </span>
          <input
            type="text"
            required
            maxLength={255}
            value={values.title}
            onChange={(event) => updateValue('title', event.target.value)}
            className={inputClassName}
          />
          {fieldError('title') && (
            <span className="mt-1 block text-sm text-red-600">
              {fieldError('title')}
            </span>
          )}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">期限</span>
          <input
            type="datetime-local"
            value={values.dueAt}
            onChange={(event) => updateValue('dueAt', event.target.value)}
            className={inputClassName}
          />
          {fieldError('due_at') && (
            <span className="mt-1 block text-sm text-red-600">
              {fieldError('due_at')}
            </span>
          )}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">優先度</span>
          <select
            value={values.priority}
            onChange={(event) =>
              updateValue('priority', event.target.value as TaskPriority)
            }
            className={inputClassName}
          >
            {Object.entries(taskPriorityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {fieldError('priority') && (
            <span className="mt-1 block text-sm text-red-600">
              {fieldError('priority')}
            </span>
          )}
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">詳細</span>
          <textarea
            rows={3}
            value={values.description}
            onChange={(event) =>
              updateValue('description', event.target.value)
            }
            className={inputClassName}
          />
          {fieldError('description') && (
            <span className="mt-1 block text-sm text-red-600">
              {fieldError('description')}
            </span>
          )}
        </label>
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isSubmitting || values.title.trim() === ''}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? '保存中...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
