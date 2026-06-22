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

import { notesApi } from './notesApi'

describe('notesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('応募別メモ一覧APIを呼ぶ', async () => {
    apiClientMock.get.mockResolvedValue({ data: { data: [] } })

    await expect(notesApi.list(20)).resolves.toEqual([])
    expect(apiClientMock.get).toHaveBeenCalledWith(
      '/api/v1/applications/20/notes',
    )
  })

  it('応募にメモを作成する', async () => {
    const input = { content: '企業研究を進める' }
    apiClientMock.post.mockResolvedValue({ data: { data: { id: 50 } } })

    await notesApi.create(20, input)

    expect(apiClientMock.post).toHaveBeenCalledWith(
      '/api/v1/applications/20/notes',
      { note: input },
    )
  })

  it('メモを更新する', async () => {
    const input = { content: '企業研究を完了した' }
    apiClientMock.patch.mockResolvedValue({ data: { data: { id: 50 } } })

    await notesApi.update(50, input)

    expect(apiClientMock.patch).toHaveBeenCalledWith('/api/v1/notes/50', {
      note: input,
    })
  })

  it('メモを削除する', async () => {
    apiClientMock.delete.mockResolvedValue({})

    await notesApi.destroy(50)

    expect(apiClientMock.delete).toHaveBeenCalledWith('/api/v1/notes/50')
  })
})
