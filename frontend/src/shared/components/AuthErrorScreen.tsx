import { useState } from 'react'
import { useAuth } from '../../features/auth/hooks/useAuth'

export function AuthErrorScreen() {
  const { retryAuthentication } = useAuth()
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = async () => {
    setIsRetrying(true)

    try {
      await retryAuthentication()
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-amber-600">Authentication error</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">認証状態を確認できませんでした</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          JWTは保持されています。APIの起動状況や通信環境を確認して、もう一度お試しください。
        </p>
        <button
          type="button"
          onClick={() => void handleRetry()}
          disabled={isRetrying}
          className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRetrying ? '再確認中...' : '認証状態を再確認'}
        </button>
      </div>
    </main>
  )
}
