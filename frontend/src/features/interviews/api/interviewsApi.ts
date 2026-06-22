import { apiClient } from '../../../shared/api/client'
import type { ApiResponse } from '../../../shared/types/api'
import type { Interview, InterviewInput } from '../types'

export const interviewsApi = {
  async list(applicationId: number | string): Promise<Interview[]> {
    const response = await apiClient.get<ApiResponse<Interview[]>>(
      `/api/v1/applications/${applicationId}/interviews`,
    )
    return response.data.data
  },

  async create(
    applicationId: number | string,
    input: InterviewInput,
  ): Promise<Interview> {
    const response = await apiClient.post<ApiResponse<Interview>>(
      `/api/v1/applications/${applicationId}/interviews`,
      { interview: input },
    )
    return response.data.data
  },

  async update(id: number, input: InterviewInput): Promise<Interview> {
    const response = await apiClient.patch<ApiResponse<Interview>>(
      `/api/v1/interviews/${id}`,
      { interview: input },
    )
    return response.data.data
  },

  async destroy(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/interviews/${id}`)
  },
}
