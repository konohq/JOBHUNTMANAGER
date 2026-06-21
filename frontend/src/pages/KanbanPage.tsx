export function KanbanPage() {
  return (
    <section>
      <p className="text-sm font-semibold text-indigo-600">Dashboard</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">カンバン</h1>
      <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="font-medium text-slate-700">認証基盤の実装が完了しました。</p>
        <p className="mt-2 text-sm text-slate-500">
          カンバンの内容は次の実装段階で追加します。
        </p>
      </div>
    </section>
  )
}
