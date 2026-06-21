import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="text-center">
        <p className="text-sm font-bold text-indigo-600">404</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">ページが見つかりません</h1>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          ホームへ戻る
        </Link>
      </div>
    </main>
  )
}
