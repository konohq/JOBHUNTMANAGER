import { Link } from 'react-router-dom'
import { formatDate } from '../../../shared/utils/date'
import type { JobPostingSummary } from '../types'

type JobPostingCardProps = {
  jobPosting: JobPostingSummary
}

export function JobPostingCard({ jobPosting }: JobPostingCardProps) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-indigo-600">
            {jobPosting.company.name}
          </p>
          <h2 className="mt-2 text-lg font-bold text-slate-900">
            {jobPosting.title}
          </h2>
        </div>
        {jobPosting.application_id && (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            応募済み
          </span>
        )}
      </div>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">雇用形態</dt>
          <dd className="text-right font-medium text-slate-700">
            {jobPosting.employment_type || '未設定'}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">勤務地</dt>
          <dd className="text-right font-medium text-slate-700">
            {jobPosting.location || '未設定'}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">応募期限</dt>
          <dd className="text-right font-medium text-slate-700">
            {formatDate(jobPosting.application_deadline)}
          </dd>
        </div>
      </dl>

      <div className="mt-auto pt-6">
        <Link
          to={`/jobs/${jobPosting.id}`}
          className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
        >
          詳細を見る
        </Link>
      </div>
    </article>
  )
}
