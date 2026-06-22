import {
  interviewResultLabels,
  interviewStatusLabels,
  interviewTypeLabels,
  type Interview,
} from '../types'

type InterviewListProps = {
  interviews: Interview[]
  updatingInterviewIds: Set<number>
  deleteConfirmInterviewId: number | null
  onEdit: (interview: Interview) => void
  onRequestDelete: (interviewId: number) => void
  onCancelDelete: () => void
  onDelete: (interview: Interview) => Promise<void>
}

const dateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const statusClasses = {
  scheduled: 'bg-violet-100 text-violet-700',
  completed: 'bg-emerald-100 text-emerald-700',
  canceled: 'bg-slate-200 text-slate-600',
} as const

const resultClasses = {
  pending: 'bg-amber-100 text-amber-700',
  passed: 'bg-sky-100 text-sky-700',
  failed: 'bg-red-100 text-red-700',
} as const

const formatDateTime = (value: string): string => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : dateTimeFormatter.format(date)
}

export function InterviewList({
  interviews,
  updatingInterviewIds,
  deleteConfirmInterviewId,
  onEdit,
  onRequestDelete,
  onCancelDelete,
  onDelete,
}: InterviewListProps) {
  if (interviews.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
        面接はまだありません。
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {interviews.map((interview) => {
        const isUpdating = updatingInterviewIds.has(interview.id)
        const isDeleteConfirming =
          deleteConfirmInterviewId === interview.id

        return (
          <li
            key={interview.id}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-900">
                  {interviewTypeLabels[interview.interview_type]}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-600">
                  {formatDateTime(interview.scheduled_at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[interview.status]}`}
                >
                  {interviewStatusLabels[interview.status]}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${resultClasses[interview.result]}`}
                >
                  {interviewResultLabels[interview.result]}
                </span>
              </div>
            </div>

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <InterviewDetail
                label="場所"
                value={interview.location || '未設定'}
              />
              <InterviewDetail
                label="担当者"
                value={interview.interviewer || '未設定'}
              />
            </dl>

            {interview.meeting_url && (
              <a
                href={interview.meeting_url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex text-sm font-semibold text-violet-600 hover:text-violet-500"
              >
                オンライン面接を開く ↗
              </a>
            )}

            {interview.details && (
              <p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                {interview.details}
              </p>
            )}

            {isDeleteConfirming ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-700">
                  この面接を削除しますか？
                </p>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onCancelDelete}
                    disabled={isUpdating}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDelete(interview)}
                    disabled={isUpdating}
                    className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {isUpdating ? '削除中...' : '削除する'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => onEdit(interview)}
                  disabled={isUpdating}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => onRequestDelete(interview.id)}
                  disabled={isUpdating}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  削除
                </button>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function InterviewDetail({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <dt className="font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-800">{value}</dd>
    </div>
  )
}
