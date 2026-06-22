export const interviewTypeLabels = {
  casual: 'カジュアル面談',
  first: '一次面接',
  second: '二次面接',
  final: '最終面接',
  other: 'その他',
} as const

export const interviewStatusLabels = {
  scheduled: '予定',
  completed: '完了',
  canceled: '中止',
} as const

export const interviewResultLabels = {
  pending: '未確定',
  passed: '通過',
  failed: '不通過',
} as const

export type InterviewType = keyof typeof interviewTypeLabels
export type InterviewStatus = keyof typeof interviewStatusLabels
export type InterviewResult = keyof typeof interviewResultLabels

export type Interview = {
  id: number
  application_id: number
  interview_type: InterviewType
  scheduled_at: string
  location: string | null
  meeting_url: string | null
  status: InterviewStatus
  result: InterviewResult
  interviewer: string | null
  details: string | null
  created_at: string
  updated_at: string
}

export type InterviewInput = {
  interview_type: InterviewType
  scheduled_at: string
  location: string
  meeting_url: string
  status: InterviewStatus
  result: InterviewResult
  interviewer: string
  details: string
}

export type InterviewFormValues = {
  interviewType: InterviewType
  scheduledAt: string
  location: string
  meetingUrl: string
  status: InterviewStatus
  result: InterviewResult
  interviewer: string
  details: string
}

export const emptyInterviewFormValues: InterviewFormValues = {
  interviewType: 'casual',
  scheduledAt: '',
  location: '',
  meetingUrl: '',
  status: 'scheduled',
  result: 'pending',
  interviewer: '',
  details: '',
}

export const toInterviewFormValues = (
  interview: Interview,
): InterviewFormValues => ({
  interviewType: interview.interview_type,
  scheduledAt: toDateTimeLocalValue(interview.scheduled_at),
  location: interview.location ?? '',
  meetingUrl: interview.meeting_url ?? '',
  status: interview.status,
  result: interview.result,
  interviewer: interview.interviewer ?? '',
  details: interview.details ?? '',
})

export const toInterviewInput = (
  values: InterviewFormValues,
): InterviewInput => ({
  interview_type: values.interviewType,
  scheduled_at: values.scheduledAt
    ? new Date(values.scheduledAt).toISOString()
    : '',
  location: values.location.trim(),
  meeting_url: values.meetingUrl.trim(),
  status: values.status,
  result: values.result,
  interviewer: values.interviewer.trim(),
  details: values.details.trim(),
})

const toDateTimeLocalValue = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  )
  return localDate.toISOString().slice(0, 16)
}
