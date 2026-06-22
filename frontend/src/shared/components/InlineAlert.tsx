type InlineAlertProps = {
  message: string
  title?: string
}

export function InlineAlert({ message, title }: InlineAlertProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {title && <p className="font-semibold">{title}</p>}
      <p className={title ? 'mt-1' : undefined}>{message}</p>
    </div>
  )
}
