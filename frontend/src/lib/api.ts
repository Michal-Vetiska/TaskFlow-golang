import type {
  ApiErrorBody,
  CreateTaskInput,
  ListTasksParams,
  PaginationMeta,
  Task,
  TaskStats,
  UpdateTaskInput,
} from '../types/task'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.status = status
    this.code = body.code
  }
}

type Envelope<T> = {
  data?: T
  meta?: PaginationMeta
  error?: ApiErrorBody
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    })
  } catch {
    throw new ApiError(0, {
      code: 'NETWORK_ERROR',
      message: 'Nelze se připojit k API. Zkontrolujte, že backend běží.',
    })
  }

  if (response.status === 204) {
    return undefined as T
  }

  const payload = (await response.json().catch(() => null)) as Envelope<unknown> | null

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error ?? {
        code: 'UNKNOWN_ERROR',
        message: 'Neočekávaná chyba API',
      },
    )
  }

  return payload as T
}

export async function listTasks(params: ListTasksParams = {}): Promise<{
  data: Task[]
  meta: PaginationMeta
}> {
  const search = new URLSearchParams()
  if (params.status) search.set('status', params.status)
  if (params.priority) search.set('priority', params.priority)
  if (params.limit != null) search.set('limit', String(params.limit))
  if (params.offset != null) search.set('offset', String(params.offset))
  const qs = search.toString()
  return request(`/api/v1/tasks${qs ? `?${qs}` : ''}`)
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const res = await request<{ data: Task }>('/api/v1/tasks', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return res.data
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  const res = await request<{ data: Task }>(`/api/v1/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return res.data
}

export async function deleteTask(id: string): Promise<void> {
  await request<void>(`/api/v1/tasks/${id}`, { method: 'DELETE' })
}

export async function getTaskStats(): Promise<TaskStats> {
  const res = await request<{ data: TaskStats }>('/api/v1/tasks/stats')
  return res.data
}

export async function listAllTasksForBoard(): Promise<Task[]> {
  const pageSize = 500
  let offset = 0
  let total = Infinity
  const items: Task[] = []

  while (offset < total) {
    const page = await listTasks({ limit: pageSize, offset })
    items.push(...page.data)
    total = page.meta.total
    offset += pageSize
    if (page.data.length === 0) break
  }

  return items
}
