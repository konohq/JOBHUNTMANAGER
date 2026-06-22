import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { jobPostingsApi } from '../features/jobPostings/api/jobPostingsApi'
import type { JobPosting } from '../features/jobPostings/types'
import { getApiErrorMessage } from '../shared/api/apiError'
import { ContentLoading } from '../shared/components/ContentLoading'
import { InlineAlert } from '../shared/components/InlineAlert'
import { formatDate, formatDateTime } from '../shared/utils/date'

export function JobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
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

  const handleDelete = async () => {
    if (!id) {
      return
    }

    setDeleteError('')
    setIsDeleting(true)

    try {
      await jobPostingsApi.destroy(id)
      navigate('/jobs', { replace: true })
    } catch (error) {
      setDeleteError(getApiErrorMessage(error))
      setShowDeleteConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section>
      <Link
        to="/jobs"
        className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
      >
        ← 求人一覧へ戻る
      </Link>

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
          <div className="space-y-6">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-semibold text-indigo-600">
                  {jobPosting.company.name}
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {jobPosting.title}
                </h1>
                {jobPosting.application && (
                  <span className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                    応募登録済み
                  </span>
                )}
              </div>

              <div className="flex gap-3">
                <Link
                  to={`/jobs/${jobPosting.id}/edit`}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  編集
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError('')
                    setShowDeleteConfirm(true)
                  }}
                  className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  削除
                </button>
              </div>
            </div>

            {deleteError && <InlineAlert message={deleteError} />}

            {showDeleteConfirm && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-job-title"
                className="rounded-2xl border border-red-200 bg-red-50 p-5"
              >
                <h2
                  id="delete-job-title"
                  className="font-semibold text-slate-900"
                >
                  この求人を削除しますか？
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  この操作は取り消せません。応募が登録されている求人は削除できません。
                </p>
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={isDeleting}
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDeleting ? '削除中...' : '削除する'}
                  </button>
                </div>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1fr_0.65fr]">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  求人情報
                </h2>
                <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                  <DetailItem
                    label="雇用形態"
                    value={jobPosting.employment_type || '未設定'}
                  />
                  <DetailItem
                    label="勤務地"
                    value={jobPosting.location || '未設定'}
                  />
                  <DetailItem
                    label="応募期限"
                    value={formatDate(jobPosting.application_deadline)}
                  />
                  <DetailItem
                    label="登録日"
                    value={formatDateTime(jobPosting.created_at)}
                  />
                </dl>

                <div className="mt-7 border-t border-slate-200 pt-6">
                  <h3 className="text-sm font-medium text-slate-500">
                    求人内容・メモ
                  </h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {jobPosting.description || '未設定'}
                  </p>
                </div>
              </section>

              <aside className="space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">企業</h2>
                  <p className="mt-4 font-medium text-slate-800">
                    {jobPosting.company.name}
                  </p>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">
                    求人URL
                  </h2>
                  {jobPosting.source_url ? (
                    <a
                      href={jobPosting.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex break-all text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                    >
                      掲載ページを開く ↗
                    </a>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">未設定</p>
                  )}
                </section>
              </aside>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

type DetailItemProps = {
  label: string
  value: string
}

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div>
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium text-slate-800">{value}</dd>
    </div>
  )
}
