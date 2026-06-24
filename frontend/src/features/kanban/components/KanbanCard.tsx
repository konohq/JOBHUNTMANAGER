import { Link } from 'react-router-dom'
import type { ApplicationStatus } from '../../applications/types'
import { formatDate } from '../../../shared/utils/date'
import {
  kanbanStatuses,
  kanbanStatusLabels,
  type KanbanCardData,
} from '../types'

type KanbanCardProps = {
  card: KanbanCardData
  isUpdating: boolean
  errorMessage?: string
  onStatusChange: (
    card: KanbanCardData,
    status: ApplicationStatus,
  ) => Promise<void>
}

export function KanbanCard({
  card,
  isUpdating,
  errorMessage,
  onStatusChange,
}: KanbanCardProps) {
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
      <Link
        to={`/applications/${card.id}`}
        className="block rounded-lg focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
        aria-label={`${card.company.name}の応募詳細を開く`}
      >
        <p className="truncate text-xs font-semibold tracking-wide text-indigo-600">
          会社
        </p>
        <h3 className="mt-2 line-clamp-2 min-h-12 text-base leading-6 font-bold text-slate-900">
          {card.company.name}
        </h3>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-500">応募日</span>
          <span className="font-medium text-slate-700">
            {formatDate(card.applied_on)}
          </span>
        </div>
      </Link>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <label className="block">
          <span className="text-xs font-medium text-slate-500">
            現在のステータス
          </span>
          <select
            value={card.status}
            disabled={isUpdating}
            onChange={(event) =>
              void onStatusChange(
                card,
                event.target.value as ApplicationStatus,
              )
            }
            className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-wait disabled:bg-slate-100 disabled:opacity-70"
            aria-label={`${card.company.name} ${card.job_posting.title}のステータス`}
          >
            {kanbanStatuses.map((status) => (
              <option key={status} value={status}>
                {kanbanStatusLabels[status]}
              </option>
            ))}
          </select>
        </label>

        {isUpdating && (
          <p className="mt-2 text-xs font-medium text-indigo-600">
            ステータスを更新中...
          </p>
        )}
        {errorMessage && (
          <p role="alert" className="mt-2 text-xs leading-5 text-red-600">
            {errorMessage}
          </p>
        )}
      </div>

      <Link
        to={`/applications/${card.id}`}
        className="mt-4 flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-700 transition group-hover:border-indigo-200 group-hover:bg-indigo-100 hover:text-indigo-800 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
        aria-label={`${card.company.name}の応募詳細を見る`}
      >
        <span>📝 応募詳細を見る</span>
        <span aria-hidden="true">→</span>
      </Link>
    </article>
  )
}
