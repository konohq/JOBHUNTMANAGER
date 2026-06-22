import { apiClient } from '../../../shared/api/client'
import type { ApiResponse } from '../../../shared/types/api'
import type {
  ApplicationDetail,
  ApplicationSummary,
  CreateApplicationInput,
  UpdateApplicationInput,
} from '../types'

export const applicationsApi = {
  async create(input: CreateApplicationInput): Promise<ApplicationSummary> {
    const response = await apiClient.post<ApiResponse<ApplicationSummary>>(
      '/api/v1/applications',
      { application: input },
    )
    return response.data.data
  },

  async get(id: number | string): Promise<ApplicationDetail> {
    const response = await apiClient.get<ApiResponse<ApplicationDetail>>(
      `/api/v1/applications/${id}`,
    )
    return response.data.data
  },

  async update(
    id: number | string,
    input: UpdateApplicationInput,
  ): Promise<ApplicationSummary> {
    const response = await apiClient.patch<ApiResponse<ApplicationSummary>>(
      `/api/v1/applications/${id}`,
      { application: input },
    )
    return response.data.data
  },

  async destroy(id: number | string): Promise<void> {
    await apiClient.delete(`/api/v1/applications/${id}`)
  },
}
