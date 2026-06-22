import {
  useEffect,
  useRef,
  useState,
  type RefObject,
  type UIEvent,
} from 'react'
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
  const topScrollRef = useRef<HTMLDivElement>(null)
  const boardScrollRef = useRef<HTMLDivElement>(null)
  const boardContentRef = useRef<HTMLDivElement>(null)
  const [boardWidth, setBoardWidth] = useState(0)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    const content = boardContentRef.current
    const board = boardScrollRef.current
    if (!content || !board) {
      return
    }

    const updateScrollState = () => {
      setBoardWidth(content.scrollWidth)
      setIsOverflowing(content.scrollWidth > board.clientWidth)
    }

    updateScrollState()
    const resizeObserver = new ResizeObserver(updateScrollState)
    resizeObserver.observe(content)
    resizeObserver.observe(board)

    return () => resizeObserver.disconnect()
  }, [])

  const syncScroll = (
    event: UIEvent<HTMLDivElement>,
    targetRef: RefObject<HTMLDivElement | null>,
  ) => {
    const target = targetRef.current
    if (target && target.scrollLeft !== event.currentTarget.scrollLeft) {
      target.scrollLeft = event.currentTarget.scrollLeft
    }
  }

  return (
    <div>
      {isOverflowing && (
        <div
          ref={topScrollRef}
          onScroll={(event) => syncScroll(event, boardScrollRef)}
          aria-label="カンバンの横スクロール"
          className="-mx-4 mb-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        >
          <div aria-hidden="true" style={{ width: boardWidth, height: 1 }} />
        </div>
      )}

      <div
        ref={boardScrollRef}
        onScroll={(event) => syncScroll(event, topScrollRef)}
        className="kanban-board-scroll -mx-4 overflow-x-auto px-4 pb-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      >
        <div
          ref={boardContentRef}
          className="flex min-w-max gap-4 2xl:w-full 2xl:min-w-0"
        >
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
    </div>
  )
}
