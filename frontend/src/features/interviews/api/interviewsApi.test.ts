import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiClientMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('../../../shared/api/client', () => ({
  apiClient: apiClientMock,
}))

import { interviewsApi } from './interviewsApi'

describe('interviewsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('応募別面接一覧APIを呼ぶ', async () => {
    apiClientMock.get.mockResolvedValue({ data: { data: [] } })

    await expect(interviewsApi.list(20)).resolves.toEqual([])
    expect(apiClientMock.get).toHaveBeenCalledWith(
      '/api/v1/applications/20/interviews',
    )
  })

  it('応募に面接を作成する', async () => {
    const input = {
      interview_type: 'first' as const,
      scheduled_at: '2026-06-25T04:00:00.000Z',
      location: '',
      meeting_url: '',
      status: 'scheduled' as const,
      result: 'pending' as const,
      interviewer: '',
      details: '',
    }
    apiClientMock.post.mockResolvedValue({ data: { data: { id: 30 } } })

    await interviewsApi.create(20, input)

    expect(apiClientMock.post).toHaveBeenCalledWith(
      '/api/v1/applications/20/interviews',
      { interview: input },
    )
  })

  it('面接を更新する', async () => {
    const input = {
      interview_type: 'final' as const,
      scheduled_at: '2026-07-01T04:00:00.000Z',
      location: '東京都',
      meeting_url: '',
      status: 'completed' as const,
      result: 'passed' as const,
      interviewer: '採用担当者',
      details: '通過',
    }
    apiClientMock.patch.mockResolvedValue({ data: { data: { id: 30 } } })

    await interviewsApi.update(30, input)

    expect(apiClientMock.patch).toHaveBeenCalledWith(
      '/api/v1/interviews/30',
      { interview: input },
    )
  })

  it('面接を削除する', async () => {
    apiClientMock.delete.mockResolvedValue({})

    await interviewsApi.destroy(30)

    expect(apiClientMock.delete).toHaveBeenCalledWith('/api/v1/interviews/30')
  })
})
