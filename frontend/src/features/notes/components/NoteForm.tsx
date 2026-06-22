import { useState, type FormEvent } from 'react'
import {
  getApiErrorMessage,
  getApiValidationErrors,
} from '../../../shared/api/apiError'
import { InlineAlert } from '../../../shared/components/InlineAlert'
import {
  toNoteInput,
  type NoteFormValues,
  type NoteInput,
} from '../types'

type NoteFormProps = {
  initialValues: NoteFormValues
  submitLabel: string
  onSubmit: (input: NoteInput) => Promise<void>
  onCancel: () => void
}

export function NoteForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: NoteFormProps) {
  const [values, setValues] = useState(initialValues)
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      await onSubmit(toNoteInput(values))
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
      setFieldErrors(getApiValidationErrors(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const contentError = (fieldErrors.content ?? []).join('、')

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-cyan-200 bg-cyan-50/50 p-5"
    >
      {errorMessage && <InlineAlert message={errorMessage} />}

      <label className="mt-1 block">
        <span className="text-sm font-medium text-slate-700">
          メモ本文 <span className="text-red-500">*</span>
        </span>
        <textarea
          rows={6}
          required
          maxLength={10_000}
          value={values.content}
          onChange={(event) => {
            setValues({ content: event.target.value })
            setFieldErrors((current) => ({ ...current, content: [] }))
          }}
          placeholder="企業研究、面接で確認したいこと、連絡事項など"
          className="mt-2 block w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
        />
        <div className="mt-1 flex justify-between gap-4">
          <span className="text-sm text-red-600">{contentError}</span>
          <span className="shrink-0 text-xs text-slate-500">
            {values.content.length.toLocaleString()} / 10,000文字
          </span>
        </div>
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
          disabled={isSubmitting || values.content.trim() === ''}
          className="rounded-xl bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? '保存中...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
