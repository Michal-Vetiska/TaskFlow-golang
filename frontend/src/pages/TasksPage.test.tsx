import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TasksPage } from './TasksPage'
import { renderWithProviders } from '../test/test-utils'
import { sampleTasks } from '../test/fixtures'
import * as api from '../lib/api'

vi.mock('../lib/api')

describe('TasksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.listTasks).mockResolvedValue({
      data: sampleTasks,
      meta: { total: 3, limit: 10, offset: 0 },
    })
    vi.mocked(api.createTask).mockResolvedValue(sampleTasks[0])
    vi.mocked(api.updateTask).mockResolvedValue({ ...sampleTasks[0], status: 'done' })
    vi.mocked(api.deleteTask).mockResolvedValue(undefined)
  })

  it('renders tasks from API', async () => {
    renderWithProviders(<TasksPage />, { route: '/tasks' })
    expect(await screen.findByText('Learn Go')).toBeInTheDocument()
    expect(screen.getByText('Build API')).toBeInTheDocument()
  })

  it('filters by status', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TasksPage />, { route: '/tasks' })
    await screen.findByText('Learn Go')
    await user.selectOptions(screen.getByLabelText('Filtr status'), 'done')
    await waitFor(() => {
      expect(api.listTasks).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'done', limit: 10, offset: 0 }),
      )
    })
  })

  it('creates a task through modal', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TasksPage />, { route: '/tasks' })
    await screen.findByText('Learn Go')
    await user.click(screen.getByRole('button', { name: /Nový úkol/i }))
    const dialog = screen.getByRole('dialog')
    await user.clear(within(dialog).getByLabelText('Title'))
    await user.type(within(dialog).getByLabelText('Title'), 'New Task')
    await user.click(within(dialog).getByRole('button', { name: 'Uložit' }))
    await waitFor(() => {
      expect(api.createTask).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New Task', priority: 'medium' }),
      )
    })
  })

  it('validates empty title', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TasksPage />, { route: '/tasks' })
    await screen.findByText('Learn Go')
    await user.click(screen.getByRole('button', { name: /Nový úkol/i }))
    const dialog = screen.getByRole('dialog')
    await user.clear(within(dialog).getByLabelText('Title'))
    await user.click(within(dialog).getByRole('button', { name: 'Uložit' }))
    expect(await screen.findByText('Title is required')).toBeInTheDocument()
    expect(api.createTask).not.toHaveBeenCalled()
  })

  it('deletes a task after confirmation', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TasksPage />, { route: '/tasks' })
    await screen.findByText('Learn Go')
    await user.click(screen.getByRole('button', { name: 'Smazat Learn Go' }))
    await user.click(screen.getByRole('button', { name: 'Smazat' }))
    await waitFor(() => {
      expect(api.deleteTask).toHaveBeenCalledWith(sampleTasks[0].id)
    })
  })
})
