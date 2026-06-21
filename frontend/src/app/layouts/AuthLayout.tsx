import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-[1.05fr_1fr]">
        <section className="hidden bg-indigo-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm font-bold tracking-[0.22em] text-indigo-100">
              JOBHUNTMANAGER
            </p>
            <h1 className="mt-8 text-4xl leading-tight font-bold">
              就職活動を、
              <br />
              ひとつの場所で整理。
            </h1>
            <p className="mt-5 max-w-sm leading-7 text-indigo-100">
              求人、応募、面接、タスクをカンバン形式で管理できます。
            </p>
          </div>
          <p className="text-sm text-indigo-200">Rails API + React SPA</p>
        </section>

        <section className="flex items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-md">
            <p className="mb-8 text-center text-sm font-bold tracking-[0.18em] text-indigo-600 lg:hidden">
              JOBHUNTMANAGER
            </p>
            <Outlet />
          </div>
        </section>
      </div>
    </main>
  )
}
