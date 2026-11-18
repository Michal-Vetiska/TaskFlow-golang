import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Dashboard } from './Dashboard'
import { renderWithProviders } from '../test/test-utils'
import { sampleStats, sampleTasks } from '../test/fixtures'
import * as api from '../lib/api'

vi.mock('../lib/api')

describe('Dashboard', () => {
  beforeEach(() => {
    vi.mocked(api.getTaskStats).mockResolvedValue(sampleStats)
    vi.mocked(api.listTasks).mockResolvedValue({
      data: sampleTasks,
      meta: { total: 3, limit: 5, offset: 0 },
    })
  })

  it('renders loading then stats from API', async () => {
    renderWithProviders(<Dashboard />)
    expect(screen.getByText('Přehled produktivity')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('33.3%')).toBeInTheDocument()
    })
    expect(screen.getByText('Learn Go')).toBeInTheDocument()
  })

  it('shows error state with retry', async () => {
    vi.mocked(api.getTaskStats).mockRejectedValue(new Error('Backend down'))
    renderWithProviders(<Dashboard />)
    expect(await screen.findByText('Backend down')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zkusit znovu' })).toBeInTheDocument()
  })
})
