import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BoardPage } from './BoardPage'
import { renderWithProviders } from '../test/test-utils'
import { sampleTasks } from '../test/fixtures'
import * as api from '../lib/api'

vi.mock('../lib/api')

describe('BoardPage', () => {
  beforeEach(() => {
    vi.mocked(api.listAllTasksForBoard).mockResolvedValue(sampleTasks)
    vi.mocked(api.updateTask).mockResolvedValue({ ...sampleTasks[0], status: 'done' })
  })

  it('renders columns and tasks', async () => {
    renderWithProviders(<BoardPage />, { route: '/board' })
    expect(await screen.findByText('Learn Go')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'To Do' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'In Progress' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Done' })).toBeInTheDocument()
  })

  it('changes status via accessible select', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BoardPage />, { route: '/board' })
    await screen.findByText('Learn Go')
    const select = screen.getByLabelText('Status úkolu Learn Go')
    await user.selectOptions(select, 'done')
    await waitFor(() => {
      expect(api.updateTask).toHaveBeenCalledWith(sampleTasks[0].id, { status: 'done' })
    })
  })
})
