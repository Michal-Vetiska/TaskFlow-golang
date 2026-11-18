import type { Task, TaskStats } from '../types/task'

export const sampleTasks: Task[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Learn Go',
    description: 'Understand interfaces',
    status: 'todo',
    priority: 'high',
    created_at: '2026-01-01T10:00:00Z',
    updated_at: '2026-01-01T10:00:00Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    title: 'Build API',
    description: 'REST handlers',
    status: 'in_progress',
    priority: 'medium',
    created_at: '2026-01-02T10:00:00Z',
    updated_at: '2026-01-02T10:00:00Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    title: 'Write tests',
    description: '',
    status: 'done',
    priority: 'low',
    created_at: '2026-01-03T10:00:00Z',
    updated_at: '2026-01-03T10:00:00Z',
  },
]

export const sampleStats: TaskStats = {
  total: 3,
  todo: 1,
  in_progress: 1,
  done: 1,
  completion_rate: 33.3,
}
