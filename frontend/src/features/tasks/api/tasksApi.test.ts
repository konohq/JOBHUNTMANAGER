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

import { tasksApi } from './tasksApi'

describe('tasksApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('応募別タスク一覧APIを呼ぶ', async () => {
    apiClientMock.get.mockResolvedValue({ data: { data: [] } })

    await expect(tasksApi.list(20)).resolves.toEqual([])
    expect(apiClientMock.get).toHaveBeenCalledWith(
      '/api/v1/applications/20/tasks',
    )
  })

  it('完了状態を更新する', async () => {
    const task = {
      id: 40,
      application_id: 20,
      title: '履歴書を送付',
      description: null,
      due_at: null,
      priority: 'medium',
      completed_at: '2026-06-22T00:00:00Z',
      overdue: false,
      created_at: '2026-06-21T00:00:00Z',
      updated_at: '2026-06-22T00:00:00Z',
    }
    apiClientMock.patch.mockResolvedValue({ data: { data: task } })

    await expect(tasksApi.update(40, { completed: true })).resolves.toEqual(
      task,
    )
    expect(apiClientMock.patch).toHaveBeenCalledWith('/api/v1/tasks/40', {
      task: { completed: true },
    })
  })

  it('応募にタスクを作成する', async () => {
    const input = {
      title: '面接資料を準備',
      description: '',
      due_at: '2026-06-25T03:00:00.000Z',
      priority: 'high' as const,
    }
    apiClientMock.post.mockResolvedValue({ data: { data: { id: 41 } } })

    await tasksApi.create(20, input)

    expect(apiClientMock.post).toHaveBeenCalledWith(
      '/api/v1/applications/20/tasks',
      { task: input },
    )
  })

  it('タスクを削除する', async () => {
    apiClientMock.delete.mockResolvedValue({})

    await tasksApi.destroy(40)

    expect(apiClientMock.delete).toHaveBeenCalledWith('/api/v1/tasks/40')
  })
})
