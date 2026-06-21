export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div
          className="mx-auto size-9 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"
          aria-hidden="true"
        />
        <p className="mt-4 text-sm font-medium text-slate-600">読み込み中...</p>
      </div>
    </div>
  )
}
