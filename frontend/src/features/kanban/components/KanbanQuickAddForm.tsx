import { useState, type FormEvent } from 'react'
import {
  getApiErrorMessage,
  getApiValidationErrors,
} from '../../../shared/api/apiError'
import { InlineAlert } from '../../../shared/components/InlineAlert'
import { getTodayDateValue } from '../../../shared/utils/date'
import { kanbanApi } from '../api/kanbanApi'
import type { KanbanCardData } from '../types'

type KanbanQuickAddFormProps = {
  onCreated: (card: KanbanCardData) => void
  onCancel: () => void
}

export function KanbanQuickAddForm({
  onCreated,
  onCancel,
}: KanbanQuickAddFormProps) {
  const [companyName, setCompanyName] = useState('')
  const [appliedOn, setAppliedOn] = useState(getTodayDateValue)
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedCompanyName = companyName.trim()

    if (!trimmedCompanyName) {
      setErrorMessage('会社名を入力してください。')
      return
    }

    setErrorMessage('')
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      const card = await kanbanApi.createApplication({
        company_name: trimmedCompanyName,
        applied_on: appliedOn,
      })
      onCreated(card)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
      setFieldErrors(getApiValidationErrors(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const companyNameError = fieldErrors.company_name?.join('、')
  const appliedOnError = fieldErrors.applied_on?.join('、')

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-indigo-200 bg-white p-3 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-900">応募を追加</h3>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
        >
          閉じる
        </button>
      </div>

      {errorMessage && (
        <div className="mt-3">
          <InlineAlert message={errorMessage} />
        </div>
      )}

      <label className="mt-3 block">
        <span className="text-xs font-medium text-slate-600">
          会社名 <span className="text-red-500">*</span>
        </span>
        <input
          type="text"
          required
          autoFocus
          value={companyName}
          onChange={(event) => {
            setCompanyName(event.target.value)
            setErrorMessage('')
            setFieldErrors((current) => ({
              ...current,
              company_name: [],
            }))
          }}
          maxLength={255}
          placeholder="株式会社サンプル"
          className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
        />
        {companyNameError && (
          <span role="alert" className="mt-1.5 block text-xs text-red-600">
            {companyNameError}
          </span>
        )}
      </label>

      <label className="mt-3 block">
        <span className="text-xs font-medium text-slate-600">
          応募日 <span className="text-red-500">*</span>
        </span>
        <input
          type="date"
          required
          value={appliedOn}
          onChange={(event) => {
            setAppliedOn(event.target.value)
            setErrorMessage('')
            setFieldErrors((current) => ({
              ...current,
              applied_on: [],
            }))
          }}
          className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
        />
        {appliedOnError && (
          <span role="alert" className="mt-1.5 block text-xs text-red-600">
            {appliedOnError}
          </span>
        )}
      </label>

      <button
        type="submit"
        disabled={isSubmitting || companyName.trim() === '' || appliedOn === ''}
        className="mt-3 w-full rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? '追加中...' : '応募済みに追加'}
      </button>
    </form>
  )
}
