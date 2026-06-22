import { apiClient } from '../../../shared/api/client'
import type { ApiResponse } from '../../../shared/types/api'
import type { ApplicationStatus } from '../../applications/types'
import {
  emptyKanbanData,
  kanbanStatuses,
  type KanbanCardData,
  type KanbanData,
} from '../types'

export const kanbanApi = {
  async get(): Promise<KanbanData> {
    const response = await apiClient.get<ApiResponse<KanbanData>>(
      '/api/v1/kanban',
    )
    const data = emptyKanbanData()

    kanbanStatuses.forEach((status) => {
      data[status] = response.data.data[status] ?? []
    })

    return data
  },

  async updateStatus(
    applicationId: number,
    status: ApplicationStatus,
  ): Promise<KanbanCardData> {
    const response = await apiClient.patch<ApiResponse<KanbanCardData>>(
      `/api/v1/applications/${applicationId}/status`,
      { application: { status } },
    )
    return response.data.data
  },
}
