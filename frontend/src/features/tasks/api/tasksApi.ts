import { apiClient } from '../../../shared/api/client'
import type { ApiResponse } from '../../../shared/types/api'
import type { Task, TaskInput, UpdateTaskInput } from '../types'

export const tasksApi = {
  async list(applicationId: number | string): Promise<Task[]> {
    const response = await apiClient.get<ApiResponse<Task[]>>(
      `/api/v1/applications/${applicationId}/tasks`,
    )
    return response.data.data
  },

  async create(
    applicationId: number | string,
    input: TaskInput,
  ): Promise<Task> {
    const response = await apiClient.post<ApiResponse<Task>>(
      `/api/v1/applications/${applicationId}/tasks`,
      { task: input },
    )
    return response.data.data
  },

  async update(id: number, input: UpdateTaskInput): Promise<Task> {
    const response = await apiClient.patch<ApiResponse<Task>>(
      `/api/v1/tasks/${id}`,
      { task: input },
    )
    return response.data.data
  },

  async destroy(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/tasks/${id}`)
  },
}
