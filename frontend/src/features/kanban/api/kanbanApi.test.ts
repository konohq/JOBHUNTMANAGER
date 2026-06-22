import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { KanbanCardData } from '../types'

const apiClientMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}))

vi.mock('../../../shared/api/client', () => ({
  apiClient: apiClientMock,
}))

import { kanbanApi } from './kanbanApi'

describe('kanbanApi.createApplication', () => {
  beforeEach(() => {
    apiClientMock.post.mockReset()
  })

  it('簡易応募登録APIだけを1回呼び、返されたカードを返す', async () => {
    const card: KanbanCardData = {
      id: 20,
      status: 'applied',
      applied_on: '2026-06-22',
      company: {
        id: 1,
        name: '株式会社サンプル',
      },
      job_posting: {
        id: 10,
        title: '株式会社サンプル',
        application_deadline: '2026-07-31',
      },
      updated_at: '2026-06-22T00:00:00Z',
    }
    apiClientMock.post.mockResolvedValue({
      data: {
        data: card,
      },
    })

    await expect(
      kanbanApi.createApplication({
        company_name: '株式会社サンプル',
        applied_on: '2026-06-22',
      }),
    ).resolves.toEqual(card)

    expect(apiClientMock.post).toHaveBeenCalledOnce()
    expect(apiClientMock.post).toHaveBeenCalledWith(
      '/api/v1/kanban/applications',
      {
        application: {
          company_name: '株式会社サンプル',
          applied_on: '2026-06-22',
        },
      },
    )
  })
})
