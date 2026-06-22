type ContentLoadingProps = {
  message?: string
}

export function ContentLoading({ message = '読み込み中...' }: ContentLoadingProps) {
  return (
    <div className="flex min-h-56 items-center justify-center rounded-2xl border border-slate-200 bg-white">
      <div className="text-center">
        <div
          className="mx-auto size-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"
          aria-hidden="true"
        />
        <p className="mt-3 text-sm font-medium text-slate-600">{message}</p>
      </div>
    </div>
  )
}
