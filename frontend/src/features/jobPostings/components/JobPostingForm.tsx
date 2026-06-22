import { useEffect, useState, type FormEvent } from 'react'
import {
  getApiErrorMessage,
  getApiValidationErrors,
} from '../../../shared/api/apiError'
import { ContentLoading } from '../../../shared/components/ContentLoading'
import { InlineAlert } from '../../../shared/components/InlineAlert'
import { companiesApi } from '../../companies/api/companiesApi'
import { CompanyCreatePanel } from '../../companies/components/CompanyCreatePanel'
import type { Company, CompanySummary } from '../../companies/types'
import {
  toJobPostingInput,
  type JobPostingFormValues,
  type JobPostingInput,
} from '../types'

type JobPostingFormProps = {
  initialValues: JobPostingFormValues
  submitLabel: string
  onSubmit: (input: JobPostingInput) => Promise<void>
}

const inputClassName =
  'mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'

export function JobPostingForm({
  initialValues,
  submitLabel,
  onSubmit,
}: JobPostingFormProps) {
  const [values, setValues] = useState<JobPostingFormValues>(initialValues)
  const [companies, setCompanies] = useState<CompanySummary[]>([])
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true)
  const [companiesError, setCompaniesError] = useState('')
  const [companiesReloadKey, setCompaniesReloadKey] = useState(0)
  const [isCreatingCompany, setIsCreatingCompany] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let active = true

    const loadCompanies = async () => {
      try {
        const loadedCompanies = await companiesApi.list()
        if (active) {
          setCompanies(loadedCompanies)
          setCompaniesError('')
        }
      } catch (error) {
        if (active) {
          setCompaniesError(getApiErrorMessage(error))
        }
      } finally {
        if (active) {
          setIsLoadingCompanies(false)
        }
      }
    }

    void loadCompanies()
    return () => {
      active = false
    }
  }, [companiesReloadKey])

  const updateValue = (field: keyof JobPostingFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const handleCompanyCreated = (company: Company) => {
    setCompanies((current) =>
      [...current, { id: company.id, name: company.name }].sort((a, b) =>
        a.name.localeCompare(b.name, 'ja'),
      ),
    )
    setCompaniesError('')
    updateValue('companyId', String(company.id))
    setIsCreatingCompany(false)
  }

  const handleReloadCompanies = () => {
    setIsLoadingCompanies(true)
    setCompaniesError('')
    setCompaniesReloadKey((current) => current + 1)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError('')
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      await onSubmit(toJobPostingInput(values))
    } catch (error) {
      setSubmitError(getApiErrorMessage(error))
      setFieldErrors(getApiValidationErrors(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const fieldError = (...fields: string[]) =>
    fields.flatMap((field) => fieldErrors[field] ?? []).join('、')

  if (isLoadingCompanies) {
    return <ContentLoading message="企業情報を読み込み中..." />
  }

  return (
    <div className="space-y-6">
      {companiesError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <InlineAlert
            title="企業一覧を取得できませんでした"
            message={companiesError}
          />
          <button
            type="button"
            onClick={handleReloadCompanies}
            className="mt-3 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            企業一覧を再読み込み
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">企業</h2>
            <p className="mt-1 text-sm text-slate-500">
              登録済み企業を選択するか、新しく企業を登録してください。
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreatingCompany((current) => !current)}
            className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
          >
            {isCreatingCompany ? '企業登録を閉じる' : '新しい企業を登録'}
          </button>
        </div>

        {isCreatingCompany && (
          <div className="mt-5">
            <CompanyCreatePanel
              onCreated={handleCompanyCreated}
              onCancel={() => setIsCreatingCompany(false)}
            />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {submitError && <InlineAlert message={submitError} />}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-semibold text-slate-900">求人情報</h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                企業 <span className="text-red-500">*</span>
              </span>
              <select
                required
                value={values.companyId}
                onChange={(event) =>
                  updateValue('companyId', event.target.value)
                }
                className={inputClassName}
                disabled={companiesError !== ''}
              >
                <option value="">企業を選択してください</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {fieldError('company', 'company_id') && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldError('company', 'company_id')}
                </p>
              )}
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                求人名 <span className="text-red-500">*</span>
              </span>
              <input
                type="text"
                required
                value={values.title}
                onChange={(event) => updateValue('title', event.target.value)}
                className={inputClassName}
                maxLength={255}
                placeholder="バックエンドエンジニア"
              />
              {fieldError('title') && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldError('title')}
                </p>
              )}
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                雇用形態
              </span>
              <input
                type="text"
                value={values.employmentType}
                onChange={(event) =>
                  updateValue('employmentType', event.target.value)
                }
                className={inputClassName}
                maxLength={255}
                placeholder="正社員"
              />
              {fieldError('employment_type') && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldError('employment_type')}
                </p>
              )}
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">勤務地</span>
              <input
                type="text"
                value={values.location}
                onChange={(event) =>
                  updateValue('location', event.target.value)
                }
                className={inputClassName}
                maxLength={255}
                placeholder="東京都"
              />
              {fieldError('location') && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldError('location')}
                </p>
              )}
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                応募期限
              </span>
              <input
                type="date"
                value={values.applicationDeadline}
                onChange={(event) =>
                  updateValue('applicationDeadline', event.target.value)
                }
                className={inputClassName}
              />
              {fieldError('application_deadline') && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldError('application_deadline')}
                </p>
              )}
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                求人URL
              </span>
              <input
                type="url"
                value={values.sourceUrl}
                onChange={(event) =>
                  updateValue('sourceUrl', event.target.value)
                }
                className={inputClassName}
                maxLength={2048}
                placeholder="https://example.com/jobs/1"
              />
              {fieldError('source_url') && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldError('source_url')}
                </p>
              )}
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                求人内容・メモ
              </span>
              <textarea
                value={values.description}
                onChange={(event) =>
                  updateValue('description', event.target.value)
                }
                className={`${inputClassName} min-h-48 resize-y`}
                maxLength={10000}
                placeholder="業務内容、必要スキル、選考時のメモなど"
              />
              <div className="mt-1 flex justify-between gap-4">
                <span className="text-sm text-red-600">
                  {fieldError('description')}
                </span>
                <span className="text-xs text-slate-400">
                  {values.description.length.toLocaleString()} / 10,000
                </span>
              </div>
            </label>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={
              isSubmitting ||
              companiesError !== '' ||
              values.companyId === '' ||
              values.title.trim() === ''
            }
            className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? '保存中...' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
