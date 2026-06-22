import type { ApplicationStatus } from '../applications/types'
import type { CompanySummary } from '../companies/types'

export const kanbanStatuses = [
  'applied',
  'document_screening',
  'interview_scheduled',
  'offered',
  'rejected',
] as const satisfies readonly ApplicationStatus[]

export const kanbanStatusLabels: Record<ApplicationStatus, string> = {
  applied: '応募済み',
  document_screening: '書類選考',
  interview_scheduled: '面接予定',
  offered: '内定',
  rejected: '不採用',
}

export type KanbanCardData = {
  id: number
  status: ApplicationStatus
  applied_on: string
  company: CompanySummary
  job_posting: {
    id: number
    title: string
  }
  updated_at: string
}

export type KanbanData = Record<ApplicationStatus, KanbanCardData[]>

export const emptyKanbanData = (): KanbanData => ({
  applied: [],
  document_screening: [],
  interview_scheduled: [],
  offered: [],
  rejected: [],
})
