import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, createTask, listTasks } from './api'

describe('api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('parses list response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: [],
          meta: { total: 0, limit: 20, offset: 0 },
        }),
      }),
    )
    const result = await listTasks({ limit: 20 })
    expect(result.meta.total).toBe(0)
  })

  it('throws ApiError on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          error: { code: 'VALIDATION_ERROR', message: 'Title is required' },
        }),
      }),
    )
    await expect(createTask({ title: '' })).rejects.toBeInstanceOf(ApiError)
  })
})
