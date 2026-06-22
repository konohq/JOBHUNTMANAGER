import type { CompanySummary } from '../companies/types'

export const applicationStatusLabels = {
  applied: '応募済み',
  document_screening: '書類選考中',
  interview_scheduled: '面接予定',
  offered: '内定',
  rejected: '見送り',
} as const

export type ApplicationStatus = keyof typeof applicationStatusLabels

export type ApplicationJobPostingSummary = {
  id: number
  title: string
  company: CompanySummary
}

export type ApplicationSummary = {
  id: number
  status: ApplicationStatus
  applied_on: string
  job_posting: ApplicationJobPostingSummary
  created_at: string
  updated_at: string
}

export type ApplicationInterview = {
  id: number
  interview_type: string
  scheduled_at: string
  location: string | null
  meeting_url: string | null
  status: string
  result: string
  interviewer: string | null
  details: string | null
  created_at: string
  updated_at: string
}

export type ApplicationTask = {
  id: number
  title: string
  description: string | null
  due_at: string | null
  priority: string
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type ApplicationNote = {
  id: number
  content: string
  created_at: string
  updated_at: string
}

export type ApplicationDetail = Omit<ApplicationSummary, 'job_posting'> & {
  job_posting: ApplicationJobPostingSummary & {
    employment_type: string | null
    location: string | null
    source_url: string | null
    application_deadline: string | null
  }
  interviews: ApplicationInterview[]
  tasks: ApplicationTask[]
  notes: ApplicationNote[]
}

export type CreateApplicationInput = {
  job_posting_id: number
  status: 'applied'
  applied_on: string
}

export type UpdateApplicationInput = {
  applied_on: string
}
