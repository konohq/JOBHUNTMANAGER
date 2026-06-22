import { formatDateTime } from '../../../shared/utils/date'
import type { Note } from '../types'

type NoteListProps = {
  notes: Note[]
  updatingNoteIds: Set<number>
  deleteConfirmNoteId: number | null
  onEdit: (note: Note) => void
  onRequestDelete: (noteId: number) => void
  onCancelDelete: () => void
  onDelete: (note: Note) => Promise<void>
}

export function NoteList({
  notes,
  updatingNoteIds,
  deleteConfirmNoteId,
  onEdit,
  onRequestDelete,
  onCancelDelete,
  onDelete,
}: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
        メモはまだありません。
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {notes.map((note) => {
        const isUpdating = updatingNoteIds.has(note.id)
        const isDeleteConfirming = deleteConfirmNoteId === note.id

        return (
          <li
            key={note.id}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
              {note.content}
            </p>
            <p className="mt-4 text-xs text-slate-500">
              更新: {formatDateTime(note.updated_at)}
            </p>

            {isDeleteConfirming ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-700">
                  このメモを削除しますか？
                </p>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onCancelDelete}
                    disabled={isUpdating}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDelete(note)}
                    disabled={isUpdating}
                    className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {isUpdating ? '削除中...' : '削除する'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => onEdit(note)}
                  disabled={isUpdating}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => onRequestDelete(note.id)}
                  disabled={isUpdating}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  削除
                </button>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
