import { useState } from 'react'
import {
  getApiErrorMessage,
  getApiValidationErrors,
} from '../../../shared/api/apiError'
import { InlineAlert } from '../../../shared/components/InlineAlert'
import { companiesApi } from '../api/companiesApi'
import type { Company, CompanyInput } from '../types'

type CompanyCreatePanelProps = {
  onCreated: (company: Company) => void
  onCancel: () => void
}

const emptyCompany: CompanyInput = {
  name: '',
  website_url: '',
  industry: '',
  location: '',
  description: '',
}

const inputClassName =
  'mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'

export function CompanyCreatePanel({
  onCreated,
  onCancel,
}: CompanyCreatePanelProps) {
  const [values, setValues] = useState<CompanyInput>(emptyCompany)
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateValue = (field: keyof CompanyInput, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const handleCreate = async () => {
    setErrorMessage('')
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      const company = await companiesApi.create({
        ...values,
        name: values.name.trim(),
        website_url: values.website_url.trim(),
        industry: values.industry.trim(),
        location: values.location.trim(),
        description: values.description.trim(),
      })
      onCreated(company)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
      setFieldErrors(getApiValidationErrors(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const fieldError = (field: keyof CompanyInput) =>
    fieldErrors[field]?.join('、')

  return (
    <section className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-900">新しい企業を登録</h3>
          <p className="mt-1 text-sm text-slate-600">
            登録後、この求人の企業として自動で選択されます。
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          閉じる
        </button>
      </div>

      {errorMessage && (
        <div className="mt-4">
          <InlineAlert message={errorMessage} />
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            企業名 <span className="text-red-500">*</span>
          </span>
          <input
            type="text"
            value={values.name}
            onChange={(event) => updateValue('name', event.target.value)}
            className={inputClassName}
            maxLength={255}
          />
          {fieldError('name') && (
            <p className="mt-1 text-sm text-red-600">{fieldError('name')}</p>
          )}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">業界</span>
          <input
            type="text"
            value={values.industry}
            onChange={(event) => updateValue('industry', event.target.value)}
            className={inputClassName}
            maxLength={255}
          />
          {fieldError('industry') && (
            <p className="mt-1 text-sm text-red-600">
              {fieldError('industry')}
            </p>
          )}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">所在地</span>
          <input
            type="text"
            value={values.location}
            onChange={(event) => updateValue('location', event.target.value)}
            className={inputClassName}
            maxLength={255}
          />
          {fieldError('location') && (
            <p className="mt-1 text-sm text-red-600">
              {fieldError('location')}
            </p>
          )}
        </label>

        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            企業Webサイト
          </span>
          <input
            type="url"
            value={values.website_url}
            onChange={(event) => updateValue('website_url', event.target.value)}
            className={inputClassName}
            placeholder="https://example.com"
            maxLength={2048}
          />
          {fieldError('website_url') && (
            <p className="mt-1 text-sm text-red-600">
              {fieldError('website_url')}
            </p>
          )}
        </label>

        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">企業メモ</span>
          <textarea
            value={values.description}
            onChange={(event) => updateValue('description', event.target.value)}
            className={`${inputClassName} min-h-28 resize-y`}
            maxLength={10000}
          />
          {fieldError('description') && (
            <p className="mt-1 text-sm text-red-600">
              {fieldError('description')}
            </p>
          )}
        </label>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={isSubmitting || values.name.trim() === ''}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? '企業を登録中...' : '企業を登録して選択'}
        </button>
      </div>
    </section>
  )
}
