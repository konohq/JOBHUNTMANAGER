import type { ApplicationStatus } from '../../applications/types'
import { KanbanCard } from './KanbanCard'
import { KanbanQuickAddForm } from './KanbanQuickAddForm'
import {
  kanbanStatusLabels,
  type KanbanCardData,
} from '../types'

type KanbanColumnProps = {
  status: ApplicationStatus
  cards: KanbanCardData[]
  updatingApplicationIds: Set<number>
  cardErrors: Record<number, string>
  isQuickAddOpen: boolean
  onOpenQuickAdd: () => void
  onCloseQuickAdd: () => void
  onCardCreated: (card: KanbanCardData) => void
  onStatusChange: (
    card: KanbanCardData,
    status: ApplicationStatus,
  ) => Promise<void>
}

const columnAccentClasses: Record<ApplicationStatus, string> = {
  applied: 'bg-sky-500',
  document_screening: 'bg-amber-500',
  interview_scheduled: 'bg-violet-500',
  offered: 'bg-emerald-500',
  rejected: 'bg-slate-500',
}

const columnBackgroundClasses: Record<ApplicationStatus, string> = {
  applied: 'bg-sky-50/70',
  document_screening: 'bg-amber-50/70',
  interview_scheduled: 'bg-violet-50/70',
  offered: 'bg-emerald-50/70',
  rejected: 'bg-slate-100/80',
}

export function KanbanColumn({
  status,
  cards,
  updatingApplicationIds,
  cardErrors,
  isQuickAddOpen,
  onOpenQuickAdd,
  onCloseQuickAdd,
  onCardCreated,
  onStatusChange,
}: KanbanColumnProps) {
  return (
    <section
      className={`flex w-72 shrink-0 flex-col rounded-2xl border border-slate-200 2xl:w-auto 2xl:min-w-0 2xl:flex-1 ${columnBackgroundClasses[status]}`}
      aria-labelledby={`kanban-column-${status}`}
    >
      <header className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className={`size-2.5 rounded-full ${columnAccentClasses[status]}`}
              aria-hidden="true"
            />
            <h2
              id={`kanban-column-${status}`}
              className="font-bold text-slate-900"
            >
              {kanbanStatusLabels[status]}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">
              {cards.length}
            </span>
            {status === 'applied' && (
              <button
                type="button"
                onClick={onOpenQuickAdd}
                disabled={isQuickAddOpen}
                aria-label="応募を追加"
                className="inline-flex size-7 items-center justify-center rounded-full bg-indigo-600 text-lg leading-none font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                +
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-48 flex-1 flex-col gap-3 border-t border-slate-200/80 p-3">
        {status === 'applied' && isQuickAddOpen && (
          <KanbanQuickAddForm
            onCreated={onCardCreated}
            onCancel={onCloseQuickAdd}
          />
        )}

        {cards.length === 0 ? (
          <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 text-center">
            <p className="text-sm text-slate-500">応募はありません</p>
          </div>
        ) : (
          cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              isUpdating={updatingApplicationIds.has(card.id)}
              errorMessage={cardErrors[card.id]}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </div>
    </section>
  )
}
