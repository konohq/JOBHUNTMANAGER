import { useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '../../../shared/api/apiError'
import { ContentLoading } from '../../../shared/components/ContentLoading'
import { InlineAlert } from '../../../shared/components/InlineAlert'
import { notesApi } from '../api/notesApi'
import {
  emptyNoteFormValues,
  toNoteFormValues,
  type Note,
  type NoteInput,
} from '../types'
import { NoteForm } from './NoteForm'
import { NoteList } from './NoteList'

type NoteSectionProps = {
  applicationId: number
  onNoteCountChange?: (count: number) => void
}

const sortNotes = (notes: Note[]): Note[] =>
  [...notes].sort((left, right) => {
    const createdDifference =
      new Date(right.created_at).getTime() -
      new Date(left.created_at).getTime()
    return createdDifference !== 0 ? createdDifference : right.id - left.id
  })

export function NoteSection({
  applicationId,
  onNoteCountChange,
}: NoteSectionProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const updatingNoteIdsRef = useRef<Set<number>>(new Set())
  const [updatingNoteIds, setUpdatingNoteIds] = useState<Set<number>>(
    () => new Set(),
  )
  const [deleteConfirmNoteId, setDeleteConfirmNoteId] = useState<number | null>(
    null,
  )

  useEffect(() => {
    let active = true

    const fetchNotes = async () => {
      try {
        const loadedNotes = await notesApi.list(applicationId)
        if (active) {
          setNotes(sortNotes(loadedNotes))
          setErrorMessage('')
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

    void fetchNotes()
    return () => {
      active = false
    }
  }, [applicationId, reloadKey])

  useEffect(() => {
    if (!isLoading && !errorMessage) {
      onNoteCountChange?.(notes.length)
    }
  }, [errorMessage, isLoading, notes.length, onNoteCountChange])

  const beginNoteUpdate = (noteId: number): boolean => {
    if (updatingNoteIdsRef.current.has(noteId)) {
      return false
    }

    const nextIds = new Set(updatingNoteIdsRef.current)
    nextIds.add(noteId)
    updatingNoteIdsRef.current = nextIds
    setUpdatingNoteIds(nextIds)
    return true
  }

  const finishNoteUpdate = (noteId: number) => {
    const nextIds = new Set(updatingNoteIdsRef.current)
    nextIds.delete(noteId)
    updatingNoteIdsRef.current = nextIds
    setUpdatingNoteIds(nextIds)
  }

  const handleCreate = async (input: NoteInput) => {
    const createdNote = await notesApi.create(applicationId, input)
    setNotes((current) => sortNotes([...current, createdNote]))
    setIsCreating(false)
  }

  const handleUpdate = async (input: NoteInput) => {
    const note = editingNote
    if (!note || !beginNoteUpdate(note.id)) {
      return
    }

    try {
      const updatedNote = await notesApi.update(note.id, input)
      setNotes((current) =>
        sortNotes(
          current.map((currentNote) =>
            currentNote.id === updatedNote.id ? updatedNote : currentNote,
          ),
        ),
      )
      setEditingNote(null)
    } finally {
      finishNoteUpdate(note.id)
    }
  }

  const handleDelete = async (note: Note) => {
    if (!beginNoteUpdate(note.id)) {
      return
    }

    setActionError('')

    try {
      await notesApi.destroy(note.id)
      setNotes((current) =>
        current.filter((currentNote) => currentNote.id !== note.id),
      )
      setDeleteConfirmNoteId(null)
      if (editingNote?.id === note.id) {
        setEditingNote(null)
      }
    } catch (error) {
      setActionError(getApiErrorMessage(error))
      setDeleteConfirmNoteId(null)
    } finally {
      finishNoteUpdate(note.id)
    }
  }

  const handleReload = () => {
    setIsLoading(true)
    setErrorMessage('')
    setReloadKey((current) => current + 1)
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">メモ</h2>
          <p className="mt-1 text-sm text-slate-500">
            企業研究や選考中に確認したい内容を記録します。
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingNote(null)
            setIsCreating(true)
            setActionError('')
          }}
          disabled={
            isLoading ||
            errorMessage !== '' ||
            isCreating ||
            editingNote !== null
          }
          className="rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          メモを追加
        </button>
      </div>

      <div className="mt-5">
        {actionError && (
          <div className="mb-4">
            <InlineAlert message={actionError} />
          </div>
        )}

        {isCreating && (
          <NoteForm
            key="new-note"
            initialValues={emptyNoteFormValues}
            submitLabel="メモを追加"
            onSubmit={handleCreate}
            onCancel={() => setIsCreating(false)}
          />
        )}

        {editingNote && (
          <NoteForm
            key={editingNote.id}
            initialValues={toNoteFormValues(editingNote)}
            submitLabel="変更を保存"
            onSubmit={handleUpdate}
            onCancel={() => setEditingNote(null)}
          />
        )}

        {(isCreating || editingNote) && <div className="h-5" />}

        {isLoading && <ContentLoading message="メモを読み込み中..." />}

        {!isLoading && errorMessage && (
          <div className="space-y-4">
            <InlineAlert message={errorMessage} />
            <button
              type="button"
              onClick={handleReload}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              再読み込み
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && (
          <NoteList
            notes={notes}
            updatingNoteIds={updatingNoteIds}
            deleteConfirmNoteId={deleteConfirmNoteId}
            onEdit={(note) => {
              setIsCreating(false)
              setEditingNote(note)
              setActionError('')
            }}
            onRequestDelete={setDeleteConfirmNoteId}
            onCancelDelete={() => setDeleteConfirmNoteId(null)}
            onDelete={handleDelete}
          />
        )}
      </div>
    </section>
  )
}
