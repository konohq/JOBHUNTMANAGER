import { useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '../../../shared/api/apiError'
import { ContentLoading } from '../../../shared/components/ContentLoading'
import { InlineAlert } from '../../../shared/components/InlineAlert'
import { interviewsApi } from '../api/interviewsApi'
import {
  emptyInterviewFormValues,
  toInterviewFormValues,
  type Interview,
  type InterviewInput,
} from '../types'
import { InterviewForm } from './InterviewForm'
import { InterviewList } from './InterviewList'

type InterviewSectionProps = {
  applicationId: number
  onInterviewCountChange?: (count: number) => void
}

const sortInterviews = (interviews: Interview[]): Interview[] =>
  [...interviews].sort((left, right) => {
    const scheduledDifference =
      new Date(left.scheduled_at).getTime() -
      new Date(right.scheduled_at).getTime()
    return scheduledDifference !== 0
      ? scheduledDifference
      : left.id - right.id
  })

export function InterviewSection({
  applicationId,
  onInterviewCountChange,
}: InterviewSectionProps) {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const [editingInterview, setEditingInterview] =
    useState<Interview | null>(null)
  const updatingInterviewIdsRef = useRef<Set<number>>(new Set())
  const [updatingInterviewIds, setUpdatingInterviewIds] = useState<
    Set<number>
  >(() => new Set())
  const [deleteConfirmInterviewId, setDeleteConfirmInterviewId] = useState<
    number | null
  >(null)

  useEffect(() => {
    let active = true

    const fetchInterviews = async () => {
      try {
        const loadedInterviews = await interviewsApi.list(applicationId)
        if (active) {
          setInterviews(sortInterviews(loadedInterviews))
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

    void fetchInterviews()
    return () => {
      active = false
    }
  }, [applicationId, reloadKey])

  useEffect(() => {
    if (!isLoading && !errorMessage) {
      onInterviewCountChange?.(interviews.length)
    }
  }, [
    errorMessage,
    interviews.length,
    isLoading,
    onInterviewCountChange,
  ])

  const beginInterviewUpdate = (interviewId: number): boolean => {
    if (updatingInterviewIdsRef.current.has(interviewId)) {
      return false
    }

    const nextIds = new Set(updatingInterviewIdsRef.current)
    nextIds.add(interviewId)
    updatingInterviewIdsRef.current = nextIds
    setUpdatingInterviewIds(nextIds)
    return true
  }

  const finishInterviewUpdate = (interviewId: number) => {
    const nextIds = new Set(updatingInterviewIdsRef.current)
    nextIds.delete(interviewId)
    updatingInterviewIdsRef.current = nextIds
    setUpdatingInterviewIds(nextIds)
  }

  const replaceInterview = (updatedInterview: Interview) => {
    setInterviews((current) =>
      sortInterviews(
        current.map((interview) =>
          interview.id === updatedInterview.id
            ? updatedInterview
            : interview,
        ),
      ),
    )
  }

  const handleCreate = async (input: InterviewInput) => {
    const createdInterview = await interviewsApi.create(applicationId, input)
    setInterviews((current) =>
      sortInterviews([...current, createdInterview]),
    )
    setIsCreating(false)
  }

  const handleUpdate = async (input: InterviewInput) => {
    const interview = editingInterview
    if (!interview || !beginInterviewUpdate(interview.id)) {
      return
    }

    try {
      const updatedInterview = await interviewsApi.update(interview.id, input)
      replaceInterview(updatedInterview)
      setEditingInterview(null)
    } finally {
      finishInterviewUpdate(interview.id)
    }
  }

  const handleDelete = async (interview: Interview) => {
    if (!beginInterviewUpdate(interview.id)) {
      return
    }

    setActionError('')

    try {
      await interviewsApi.destroy(interview.id)
      setInterviews((current) =>
        current.filter(
          (currentInterview) => currentInterview.id !== interview.id,
        ),
      )
      setDeleteConfirmInterviewId(null)
      if (editingInterview?.id === interview.id) {
        setEditingInterview(null)
      }
    } catch (error) {
      setActionError(getApiErrorMessage(error))
      setDeleteConfirmInterviewId(null)
    } finally {
      finishInterviewUpdate(interview.id)
    }
  }

  const handleReload = () => {
    setIsLoading(true)
    setErrorMessage('')
    setReloadKey((current) => current + 1)
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">面接</h2>
          <p className="mt-1 text-sm text-slate-500">
            面接予定、実施状況、選考結果を管理します。
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingInterview(null)
            setIsCreating(true)
            setActionError('')
          }}
          disabled={
            isLoading ||
            errorMessage !== '' ||
            isCreating ||
            editingInterview !== null
          }
          className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          面接を追加
        </button>
      </div>

      <div className="mt-5">
        {actionError && (
          <div className="mb-4">
            <InlineAlert message={actionError} />
          </div>
        )}

        {isCreating && (
          <InterviewForm
            key="new-interview"
            initialValues={emptyInterviewFormValues}
            submitLabel="面接を追加"
            onSubmit={handleCreate}
            onCancel={() => setIsCreating(false)}
          />
        )}

        {editingInterview && (
          <InterviewForm
            key={editingInterview.id}
            initialValues={toInterviewFormValues(editingInterview)}
            submitLabel="変更を保存"
            onSubmit={handleUpdate}
            onCancel={() => setEditingInterview(null)}
          />
        )}

        {(isCreating || editingInterview) && <div className="h-5" />}

        {isLoading && <ContentLoading message="面接を読み込み中..." />}

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

        {!isLoading && !errorMessage && (
          <InterviewList
            interviews={interviews}
            updatingInterviewIds={updatingInterviewIds}
            deleteConfirmInterviewId={deleteConfirmInterviewId}
            onEdit={(interview) => {
              setIsCreating(false)
              setEditingInterview(interview)
              setActionError('')
            }}
            onRequestDelete={setDeleteConfirmInterviewId}
            onCancelDelete={() => setDeleteConfirmInterviewId(null)}
            onDelete={handleDelete}
          />
        )}
      </div>
    </section>
  )
}
