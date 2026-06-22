const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

export const formatDate = (value: string | null): string => {
  if (!value) {
    return '未設定'
  }

  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
}

export const formatDateTime = (value: string): string => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
}

export const getTodayDateValue = (): string => {
  const today = new Date()
  const localTime = new Date(
    today.getTime() - today.getTimezoneOffset() * 60_000,
  )
  return localTime.toISOString().slice(0, 10)
}
