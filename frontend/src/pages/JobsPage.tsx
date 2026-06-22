import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { jobPostingsApi } from '../features/jobPostings/api/jobPostingsApi'
import { JobPostingCard } from '../features/jobPostings/components/JobPostingCard'
import type { JobPostingSummary } from '../features/jobPostings/types'
import { getApiErrorMessage } from '../shared/api/apiError'
import { ContentLoading } from '../shared/components/ContentLoading'
import { InlineAlert } from '../shared/components/InlineAlert'

export function JobsPage() {
  const [jobPostings, setJobPostings] = useState<JobPostingSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    const fetchJobPostings = async () => {
      try {
        const loadedJobPostings = await jobPostingsApi.list()
        if (active) {
          setJobPostings(loadedJobPostings)
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

    void fetchJobPostings()
    return () => {
      active = false
    }
  }, [reloadKey])

  const handleReload = () => {
    setIsLoading(true)
    setErrorMessage('')
    setReloadKey((current) => current + 1)
  }

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Job Postings</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            求人管理
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            気になる求人と企業情報をまとめて管理します。
          </p>
        </div>
        <Link
          to="/jobs/new"
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          求人を追加
        </Link>
      </div>

      <div className="mt-8">
        {isLoading && <ContentLoading message="求人を読み込み中..." />}

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

        {!isLoading && !errorMessage && jobPostings.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <h2 className="text-lg font-semibold text-slate-900">
              まだ求人が登録されていません
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              最初の求人と企業情報を登録してみましょう。
            </p>
            <Link
              to="/jobs/new"
              className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              求人を登録する
            </Link>
          </div>
        )}

        {!isLoading && !errorMessage && jobPostings.length > 0 && (
          <>
            <p className="mb-4 text-sm text-slate-500">
              {jobPostings.length.toLocaleString()}件の求人
            </p>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {jobPostings.map((jobPosting) => (
                <JobPostingCard
                  key={jobPosting.id}
                  jobPosting={jobPosting}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
