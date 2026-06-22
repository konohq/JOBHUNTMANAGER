export type Note = {
  id: number
  application_id: number
  content: string
  created_at: string
  updated_at: string
}

export type NoteInput = {
  content: string
}

export type NoteFormValues = {
  content: string
}

export const emptyNoteFormValues: NoteFormValues = {
  content: '',
}

export const toNoteFormValues = (note: Note): NoteFormValues => ({
  content: note.content,
})

export const toNoteInput = (values: NoteFormValues): NoteInput => ({
  content: values.content.trim(),
})
