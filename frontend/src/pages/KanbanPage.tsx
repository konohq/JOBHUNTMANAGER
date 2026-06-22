import { useEffect, useMemo, useState } from 'react'
import type { ApplicationStatus } from '../features/applications/types'
import { kanbanApi } from '../features/kanban/api/kanbanApi'
import { KanbanBoard } from '../features/kanban/components/KanbanBoard'
import {
  emptyKanbanData,
  kanbanStatuses,
  type KanbanCardData,
  type KanbanData,
} from '../features/kanban/types'
import { getApiErrorMessage } from '../shared/api/apiError'
import { ContentLoading } from '../shared/components/ContentLoading'
import { InlineAlert } from '../shared/components/InlineAlert'

const sortCards = (cards: KanbanCardData[]): KanbanCardData[] =>
  [...cards].sort((left, right) => {
    const updatedAtDifference =
      new Date(right.updated_at).getTime() -
      new Date(left.updated_at).getTime()

    return updatedAtDifference !== 0
      ? updatedAtDifference
      : right.id - left.id
  })

export function KanbanPage() {
  const [data, setData] = useState<KanbanData>(emptyKanbanData)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [updatingApplicationIds, setUpdatingApplicationIds] = useState(
    () => new Set<number>(),
  )
  const [cardErrors, setCardErrors] = useState<Record<number, string>>({})
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)

  useEffect(() => {
    let active = true

    const fetchKanban = async () => {
      try {
        const loadedData = await kanbanApi.get()
        if (active) {
          setData(loadedData)
          setErrorMessage('')
          setCardErrors({})
        }
      } catch (error) {
        if (active) {
          setErrorMessage(getApiErrorMessage(error))
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void fetchKanban()
    return () => {
      active = false
    }
  }, [reloadKey])

  const totalApplications = useMemo(
    () =>
      kanbanStatuses.reduce(
        (total, status) => total + data[status].length,
        0,
      ),
    [data],
  )

  const handleReload = () => {
    setIsLoading(true)
    setErrorMessage('')
    setReloadKey((current) => current + 1)
  }

  const handleStatusChange = async (
    card: KanbanCardData,
    nextStatus: ApplicationStatus,
  ) => {
    if (nextStatus === card.status || updatingApplicationIds.has(card.id)) {
      return
    }

    setCardErrors((current) => {
      const nextErrors = { ...current }
      delete nextErrors[card.id]
      return nextErrors
    })
    setUpdatingApplicationIds((current) => {
      const nextIds = new Set(current)
      nextIds.add(card.id)
      return nextIds
    })

    try {
      const updatedCard = await kanbanApi.updateStatus(card.id, nextStatus)

      setData((current) => {
        const nextData = emptyKanbanData()

        kanbanStatuses.forEach((status) => {
          nextData[status] = current[status].filter(
            (currentCard) => currentCard.id !== card.id,
          )
        })
        nextData[updatedCard.status] = sortCards([
          updatedCard,
          ...nextData[updatedCard.status],
        ])

        return nextData
      })
    } catch (error) {
      setCardErrors((current) => ({
        ...current,
        [card.id]: `${getApiErrorMessage(error)} 元のステータスに戻しました。`,
      }))
    } finally {
      setUpdatingApplicationIds((current) => {
        const nextIds = new Set(current)
        nextIds.delete(card.id)
        return nextIds
      })
    }
  }

  const handleCardCreated = (card: KanbanCardData) => {
    setData((current) => ({
      ...current,
      applied: sortCards([card, ...current.applied]),
    }))
    setIsQuickAddOpen(false)
  }

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            応募カンバン
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            応募の進捗を5つのステータスで管理します。
          </p>
        </div>

        {!isLoading && !errorMessage && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-500">
              全{totalApplications.toLocaleString()}件
            </span>
            <button
              type="button"
              onClick={handleReload}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              再読み込み
            </button>
          </div>
        )}
      </div>

      <div className="mt-8">
        {isLoading && <ContentLoading message="カンバンを読み込み中..." />}

        {!isLoading && errorMessage && (
          <div className="space-y-4">
            <InlineAlert message={errorMessage} />
            <button
              type="button"
              onClick={handleReload}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              再読み込み
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && (
          <KanbanBoard
            data={data}
            updatingApplicationIds={updatingApplicationIds}
            cardErrors={cardErrors}
            isQuickAddOpen={isQuickAddOpen}
            onOpenQuickAdd={() => setIsQuickAddOpen(true)}
            onCloseQuickAdd={() => setIsQuickAddOpen(false)}
            onCardCreated={handleCardCreated}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>
    </section>
  )
}
