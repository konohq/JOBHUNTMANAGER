import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { jobPostingsApi } from '../features/jobPostings/api/jobPostingsApi'
import { JobPostingForm } from '../features/jobPostings/components/JobPostingForm'
import {
  toJobPostingFormValues,
  type JobPosting,
  type JobPostingInput,
} from '../features/jobPostings/types'
import { getApiErrorMessage } from '../shared/api/apiError'
import { ContentLoading } from '../shared/components/ContentLoading'
import { InlineAlert } from '../shared/components/InlineAlert'

export function JobEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!id) {
      return
    }

    let active = true

    const fetchJobPosting = async () => {
      try {
        const loadedJobPosting = await jobPostingsApi.get(id)
        if (active) {
          setJobPosting(loadedJobPosting)
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

    void fetchJobPosting()
    return () => {
      active = false
    }
  }, [id, reloadKey])

  const handleReload = () => {
    setIsLoading(true)
    setErrorMessage('')
    setReloadKey((current) => current + 1)
  }

  const handleSubmit = async (input: JobPostingInput) => {
    if (!id) {
      throw new Error('求人IDが指定されていません。')
    }

    const updatedJobPosting = await jobPostingsApi.update(id, input)
    navigate(`/jobs/${updatedJobPosting.id}`, { replace: true })
  }

  return (
    <section>
      <Link
        to={id ? `/jobs/${id}` : '/jobs'}
        className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
      >
        ← 求人詳細へ戻る
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        求人を編集
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        登録済みの企業や求人情報を変更できます。
      </p>

      <div className="mt-8">
        {!id && (
          <InlineAlert message="求人IDが指定されていません。" />
        )}

        {id && isLoading && <ContentLoading message="求人を読み込み中..." />}

        {id && !isLoading && errorMessage && (
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

        {id && !isLoading && !errorMessage && jobPosting && (
          <JobPostingForm
            key={jobPosting.id}
            initialValues={toJobPostingFormValues(jobPosting)}
            submitLabel="変更を保存"
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </section>
  )
}
