import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { applicationsApi } from '../features/applications/api/applicationsApi'
import {
  applicationStatusLabels,
  type ApplicationDetail,
} from '../features/applications/types'
import { InterviewSection } from '../features/interviews/components/InterviewSection'
import { NoteSection } from '../features/notes/components/NoteSection'
import { TaskSection } from '../features/tasks/components/TaskSection'
import {
  getApiErrorMessage,
  getApiValidationErrors,
} from '../shared/api/apiError'
import { ContentLoading } from '../shared/components/ContentLoading'
import { InlineAlert } from '../shared/components/InlineAlert'
import { formatDateTime } from '../shared/utils/date'

export function ApplicationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [application, setApplication] = useState<ApplicationDetail | null>(null)
  const [interviewCount, setInterviewCount] = useState(0)
  const [taskCount, setTaskCount] = useState(0)
  const [noteCount, setNoteCount] = useState(0)
  const [appliedOn, setAppliedOn] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [updateError, setUpdateError] = useState('')
  const [appliedOnError, setAppliedOnError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!id) {
      return
    }

    let active = true

    const fetchApplication = async () => {
      try {
        const loadedApplication = await applicationsApi.get(id)
        if (active) {
          setApplication(loadedApplication)
          setAppliedOn(loadedApplication.applied_on)
          setInterviewCount(loadedApplication.interviews.length)
          setTaskCount(loadedApplication.tasks.length)
          setNoteCount(loadedApplication.notes.length)
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

    void fetchApplication()
    return () => {
      active = false
    }
  }, [id, reloadKey])

  const handleReload = () => {
    setIsLoading(true)
    setErrorMessage('')
    setReloadKey((current) => current + 1)
  }

  const handleTaskCountChange = useCallback((count: number) => {
    setTaskCount(count)
  }, [])

  const handleInterviewCountChange = useCallback((count: number) => {
    setInterviewCount(count)
  }, [])

  const handleNoteCountChange = useCallback((count: number) => {
    setNoteCount(count)
  }, [])

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!id || !application) {
      return
    }

    setUpdateError('')
    setAppliedOnError('')
    setIsUpdating(true)

    try {
      const updatedApplication = await applicationsApi.update(id, {
        applied_on: appliedOn,
      })
      setApplication((current) =>
        current
          ? {
              ...current,
              applied_on: updatedApplication.applied_on,
              updated_at: updatedApplication.updated_at,
            }
          : current,
      )
      setAppliedOn(updatedApplication.applied_on)
    } catch (error) {
      setUpdateError(getApiErrorMessage(error))
      setAppliedOnError(
        getApiValidationErrors(error).applied_on?.join('、') ?? '',
      )
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !application) {
      return
    }

    setDeleteError('')
    setIsDeleting(true)

    try {
      await applicationsApi.destroy(id)
      navigate('/kanban', { replace: true })
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
        to="/kanban"
        className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
      >
        ← カンバンへ戻る
      </Link>

      <div className="mt-8">
        {!id && <InlineAlert message="応募IDが指定されていません。" />}

        {id && isLoading && <ContentLoading message="応募情報を読み込み中..." />}

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

        {id && !isLoading && !errorMessage && application && (
          <div className="space-y-6">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-semibold text-indigo-600">
                  応募情報
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {application.job_posting.company.name}
                </h1>
                <span className="mt-4 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                  {applicationStatusLabels[application.status]}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeleteError('')
                  setShowDeleteConfirm(true)
                }}
                className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                応募を削除
              </button>
            </div>

            {deleteError && <InlineAlert message={deleteError} />}

            {showDeleteConfirm && (
              <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <h2 className="font-semibold text-slate-900">
                  この応募を削除しますか？
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  この操作は取り消せません。今後登録する面接、タスク、メモも一緒に削除されます。
                </p>
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
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
              </section>
            )}

            <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  応募情報
                </h2>

                {updateError && (
                  <div className="mt-4">
                    <InlineAlert message={updateError} />
                  </div>
                )}

                <form onSubmit={handleUpdate} className="mt-6">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      応募日
                    </span>
                    <input
                      type="date"
                      required
                      value={appliedOn}
                      onChange={(event) => {
                        setAppliedOn(event.target.value)
                        setAppliedOnError('')
                      }}
                      className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 sm:max-w-xs"
                    />
                    {appliedOnError && (
                      <p className="mt-1 text-sm text-red-600">
                        {appliedOnError}
                      </p>
                    )}
                  </label>

                  <button
                    type="submit"
                    disabled={
                      isUpdating ||
                      appliedOn === '' ||
                      appliedOn === application.applied_on
                    }
                    className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUpdating ? '更新中...' : '応募日を更新'}
                  </button>
                </form>

                <dl className="mt-7 grid gap-5 border-t border-slate-200 pt-6 sm:grid-cols-2">
                  <DetailItem
                    label="ステータス"
                    value={applicationStatusLabels[application.status]}
                  />
                  <DetailItem
                    label="登録日"
                    value={formatDateTime(application.created_at)}
                  />
                </dl>
              </section>

              <aside className="space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">
                    企業情報
                  </h2>
                  <dl className="mt-5 space-y-4">
                    <DetailItem
                      label="企業"
                      value={application.job_posting.company.name}
                    />
                  </dl>
                  {application.job_posting.source_url && (
                    <a
                      href={application.job_posting.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                    >
                      求人ページを開く ↗
                    </a>
                  )}
                </section>
              </aside>
            </div>

            <section className="grid gap-4 sm:grid-cols-3">
              <RelatedResource
                label="面接"
                count={interviewCount}
              />
              <RelatedResource label="タスク" count={taskCount} />
              <RelatedResource label="メモ" count={noteCount} />
            </section>

            <InterviewSection
              applicationId={application.id}
              onInterviewCountChange={handleInterviewCountChange}
            />

            <TaskSection
              applicationId={application.id}
              onTaskCountChange={handleTaskCountChange}
            />

            <NoteSection
              applicationId={application.id}
              onNoteCountChange={handleNoteCountChange}
            />
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

type RelatedResourceProps = {
  label: string
  count: number
}

function RelatedResource({ label, count }: RelatedResourceProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">
        {count.toLocaleString()}
        <span className="ml-1 text-sm font-medium text-slate-500">件</span>
      </p>
    </div>
  )
}
