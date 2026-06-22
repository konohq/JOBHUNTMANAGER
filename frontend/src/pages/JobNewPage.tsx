import { Link, useNavigate } from 'react-router-dom'
import { jobPostingsApi } from '../features/jobPostings/api/jobPostingsApi'
import { JobPostingForm } from '../features/jobPostings/components/JobPostingForm'
import {
  emptyJobPostingFormValues,
  type JobPostingInput,
} from '../features/jobPostings/types'

export function JobNewPage() {
  const navigate = useNavigate()

  const handleSubmit = async (input: JobPostingInput) => {
    const jobPosting = await jobPostingsApi.create(input)
    navigate(`/jobs/${jobPosting.id}`, { replace: true })
  }

  return (
    <section>
      <Link
        to="/jobs"
        className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
      >
        ← 求人一覧へ戻る
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        求人を登録
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        企業を選択し、求人に関する情報を入力してください。
      </p>

      <div className="mt-8">
        <JobPostingForm
          initialValues={emptyJobPostingFormValues}
          submitLabel="求人を登録"
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  )
}
