import { apiClient } from '../../../shared/api/client'
import type { ApiResponse } from '../../../shared/types/api'
import type { Company, CompanyInput, CompanySummary } from '../types'

export const companiesApi = {
  async list(): Promise<CompanySummary[]> {
    const response = await apiClient.get<ApiResponse<CompanySummary[]>>(
      '/api/v1/companies',
    )
    return response.data.data
  },

  async create(input: CompanyInput): Promise<Company> {
    const response = await apiClient.post<ApiResponse<Company>>(
      '/api/v1/companies',
      { company: input },
    )
    return response.data.data
  },
}
