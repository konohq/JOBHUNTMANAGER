import { useState, type FormEvent } from 'react'
import {
  getApiErrorMessage,
  getApiValidationErrors,
} from '../../../shared/api/apiError'
import { InlineAlert } from '../../../shared/components/InlineAlert'
import { getTodayDateValue } from '../../../shared/utils/date'
import { applicationsApi } from '../api/applicationsApi'
import type { ApplicationSummary } from '../types'

type ApplicationCreatePanelProps = {
  jobPostingId: number
  onCreated: (application: ApplicationSummary) => void
  onCancel: () => void
}

export function ApplicationCreatePanel({
  jobPostingId,
  onCreated,
  onCancel,
}: ApplicationCreatePanelProps) {
  const [appliedOn, setAppliedOn] = useState(getTodayDateValue)
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      const application = await applicationsApi.create({
        job_posting_id: jobPostingId,
        status: 'applied',
        applied_on: appliedOn,
      })
      onCreated(application)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
      setFieldErrors(getApiValidationErrors(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const appliedOnError = fieldErrors.applied_on?.join('、')
  const jobPostingError = [
    ...(fieldErrors.job_posting ?? []),
    ...(fieldErrors.job_posting_id ?? []),
  ].join('、')

  return (
    <section className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-slate-900">応募を登録</h2>
          <p className="mt-1 text-sm text-slate-600">
            応募日は後から応募詳細画面でも変更できます。
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="text-sm font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
        >
          閉じる
        </button>
      </div>

      {errorMessage && (
        <div className="mt-4">
          <InlineAlert message={errorMessage} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            応募日 <span className="text-red-500">*</span>
          </span>
          <input
            type="date"
            required
            value={appliedOn}
            onChange={(event) => setAppliedOn(event.target.value)}
            className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 sm:max-w-xs"
          />
          {appliedOnError && (
            <p className="mt-1 text-sm text-red-600">{appliedOnError}</p>
          )}
          {jobPostingError && (
            <p className="mt-1 text-sm text-red-600">{jobPostingError}</p>
          )}
        </label>

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
            disabled={isSubmitting || appliedOn === ''}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? '応募を登録中...' : '応募する'}
          </button>
        </div>
      </form>
    </section>
  )
}
