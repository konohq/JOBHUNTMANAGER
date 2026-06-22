import { apiClient } from '../../../shared/api/client'
import type { ApiResponse } from '../../../shared/types/api'
import type {
  JobPosting,
  JobPostingInput,
  JobPostingSummary,
} from '../types'

export const jobPostingsApi = {
  async list(): Promise<JobPostingSummary[]> {
    const response = await apiClient.get<ApiResponse<JobPostingSummary[]>>(
      '/api/v1/job_postings',
    )
    return response.data.data
  },

  async get(id: number | string): Promise<JobPosting> {
    const response = await apiClient.get<ApiResponse<JobPosting>>(
      `/api/v1/job_postings/${id}`,
    )
    return response.data.data
  },

  async create(input: JobPostingInput): Promise<JobPosting> {
    const response = await apiClient.post<ApiResponse<JobPosting>>(
      '/api/v1/job_postings',
      { job_posting: input },
    )
    return response.data.data
  },

  async update(
    id: number | string,
    input: JobPostingInput,
  ): Promise<JobPosting> {
    const response = await apiClient.patch<ApiResponse<JobPosting>>(
      `/api/v1/job_postings/${id}`,
      { job_posting: input },
    )
    return response.data.data
  },

  async destroy(id: number | string): Promise<void> {
    await apiClient.delete(`/api/v1/job_postings/${id}`)
  },
}
