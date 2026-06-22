import { apiClient } from '../../../shared/api/client'
import type { ApiResponse } from '../../../shared/types/api'
import type { Note, NoteInput } from '../types'

export const notesApi = {
  async list(applicationId: number | string): Promise<Note[]> {
    const response = await apiClient.get<ApiResponse<Note[]>>(
      `/api/v1/applications/${applicationId}/notes`,
    )
    return response.data.data
  },

  async create(
    applicationId: number | string,
    input: NoteInput,
  ): Promise<Note> {
    const response = await apiClient.post<ApiResponse<Note>>(
      `/api/v1/applications/${applicationId}/notes`,
      { note: input },
    )
    return response.data.data
  },

  async update(id: number, input: NoteInput): Promise<Note> {
    const response = await apiClient.patch<ApiResponse<Note>>(
      `/api/v1/notes/${id}`,
      { note: input },
    )
    return response.data.data
  },

  async destroy(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/notes/${id}`)
  },
}
