import type { CompanySummary } from '../companies/types'

export type ApplicationSummary = {
  id: number
  status: string
  applied_on: string
}

export type JobPostingSummary = {
  id: number
  title: string
  employment_type: string | null
  location: string | null
  application_deadline: string | null
  company: CompanySummary
  application_id: number | null
  created_at: string
  updated_at: string
}

export type JobPosting = Omit<JobPostingSummary, 'application_id'> & {
  source_url: string | null
  description: string | null
  application: ApplicationSummary | null
}

export type JobPostingInput = {
  company_id: number
  title: string
  employment_type: string
  location: string
  source_url: string
  description: string
  application_deadline: string
}

export type JobPostingFormValues = {
  companyId: string
  title: string
  employmentType: string
  location: string
  sourceUrl: string
  description: string
  applicationDeadline: string
}

export const emptyJobPostingFormValues: JobPostingFormValues = {
  companyId: '',
  title: '',
  employmentType: '',
  location: '',
  sourceUrl: '',
  description: '',
  applicationDeadline: '',
}

export const toJobPostingInput = (
  values: JobPostingFormValues,
): JobPostingInput => ({
  company_id: Number(values.companyId),
  title: values.title.trim(),
  employment_type: values.employmentType.trim(),
  location: values.location.trim(),
  source_url: values.sourceUrl.trim(),
  description: values.description.trim(),
  application_deadline: values.applicationDeadline,
})

export const toJobPostingFormValues = (
  jobPosting: JobPosting,
): JobPostingFormValues => ({
  companyId: String(jobPosting.company.id),
  title: jobPosting.title,
  employmentType: jobPosting.employment_type ?? '',
  location: jobPosting.location ?? '',
  sourceUrl: jobPosting.source_url ?? '',
  description: jobPosting.description ?? '',
  applicationDeadline: jobPosting.application_deadline ?? '',
})
