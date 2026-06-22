import { useState, type FormEvent } from 'react'
import {
  getApiErrorMessage,
  getApiValidationErrors,
} from '../../../shared/api/apiError'
import { InlineAlert } from '../../../shared/components/InlineAlert'
import {
  interviewResultLabels,
  interviewStatusLabels,
  interviewTypeLabels,
  toInterviewInput,
  type InterviewFormValues,
  type InterviewInput,
  type InterviewResult,
  type InterviewStatus,
  type InterviewType,
} from '../types'

type InterviewFormProps = {
  initialValues: InterviewFormValues
  submitLabel: string
  onSubmit: (input: InterviewInput) => Promise<void>
  onCancel: () => void
}

const inputClassName =
  'mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'

const errorFieldNames: Record<keyof InterviewFormValues, string> = {
  interviewType: 'interview_type',
  scheduledAt: 'scheduled_at',
  location: 'location',
  meetingUrl: 'meeting_url',
  status: 'status',
  result: 'result',
  interviewer: 'interviewer',
  details: 'details',
}

export function InterviewForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: InterviewFormProps) {
  const [values, setValues] = useState(initialValues)
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateValue = (
    field: keyof InterviewFormValues,
    value: string,
  ) => {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({
      ...current,
      [errorFieldNames[field]]: [],
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      await onSubmit(toInterviewInput(values))
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
      setFieldErrors(getApiValidationErrors(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const fieldError = (field: string) =>
    (fieldErrors[field] ?? []).join('、')

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-violet-200 bg-violet-50/50 p-5"
    >
      {errorMessage && <InlineAlert message={errorMessage} />}

      <div className="mt-1 grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            面接日時 <span className="text-red-500">*</span>
          </span>
          <input
            type="datetime-local"
            required
            value={values.scheduledAt}
            onChange={(event) =>
              updateValue('scheduledAt', event.target.value)
            }
            className={inputClassName}
          />
          {fieldError('scheduled_at') && (
            <span className="mt-1 block text-sm text-red-600">
              {fieldError('scheduled_at')}
            </span>
          )}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">面接種別</span>
          <select
            value={values.interviewType}
            onChange={(event) =>
              updateValue(
                'interviewType',
                event.target.value as InterviewType,
              )
            }
            className={inputClassName}
          >
            {Object.entries(interviewTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {fieldError('interview_type') && (
            <span className="mt-1 block text-sm text-red-600">
              {fieldError('interview_type')}
            </span>
          )}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">状態</span>
          <select
            value={values.status}
            onChange={(event) =>
              updateValue('status', event.target.value as InterviewStatus)
            }
            className={inputClassName}
          >
            {Object.entries(interviewStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {fieldError('status') && (
            <span className="mt-1 block text-sm text-red-600">
              {fieldError('status')}
            </span>
          )}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">選考結果</span>
          <select
            value={values.result}
            onChange={(event) =>
              updateValue('result', event.target.value as InterviewResult)
            }
            className={inputClassName}
          >
            {Object.entries(interviewResultLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {fieldError('result') && (
            <span className="mt-1 block text-sm text-red-600">
              {fieldError('result')}
            </span>
          )}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">場所</span>
          <input
            type="text"
            maxLength={255}
            value={values.location}
            onChange={(event) => updateValue('location', event.target.value)}
            className={inputClassName}
          />
          {fieldError('location') && (
            <span className="mt-1 block text-sm text-red-600">
              {fieldError('location')}
            </span>
          )}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">担当者</span>
          <input
            type="text"
            maxLength={255}
            value={values.interviewer}
            onChange={(event) =>
              updateValue('interviewer', event.target.value)
            }
            className={inputClassName}
          />
          {fieldError('interviewer') && (
            <span className="mt-1 block text-sm text-red-600">
              {fieldError('interviewer')}
            </span>
          )}
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            オンラインURL
          </span>
          <input
            type="url"
            maxLength={2048}
            value={values.meetingUrl}
            onChange={(event) => updateValue('meetingUrl', event.target.value)}
            placeholder="https://meet.example.com/..."
            className={inputClassName}
          />
          {fieldError('meeting_url') && (
            <span className="mt-1 block text-sm text-red-600">
              {fieldError('meeting_url')}
            </span>
          )}
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">補足</span>
          <textarea
            rows={4}
            maxLength={10000}
            value={values.details}
            onChange={(event) => updateValue('details', event.target.value)}
            className={inputClassName}
          />
          {fieldError('details') && (
            <span className="mt-1 block text-sm text-red-600">
              {fieldError('details')}
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
          disabled={isSubmitting || values.scheduledAt === ''}
          className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? '保存中...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
