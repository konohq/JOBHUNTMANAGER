import type { ApplicationStatus } from '../../applications/types'
import { KanbanColumn } from './KanbanColumn'
import {
  kanbanStatuses,
  type KanbanCardData,
  type KanbanData,
} from '../types'

type KanbanBoardProps = {
  data: KanbanData
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

export function KanbanBoard({
  data,
  updatingApplicationIds,
  cardErrors,
  isQuickAddOpen,
  onOpenQuickAdd,
  onCloseQuickAdd,
  onCardCreated,
  onStatusChange,
}: KanbanBoardProps) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex min-w-max gap-4">
        {kanbanStatuses.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            cards={data[status]}
            updatingApplicationIds={updatingApplicationIds}
            cardErrors={cardErrors}
            isQuickAddOpen={isQuickAddOpen}
            onOpenQuickAdd={onOpenQuickAdd}
            onCloseQuickAdd={onCloseQuickAdd}
            onCardCreated={onCardCreated}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </div>
  )
}
