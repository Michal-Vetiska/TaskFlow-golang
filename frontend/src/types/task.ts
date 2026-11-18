export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  created_at: string
  updated_at: string
}

export interface TaskStats {
  total: number
  todo: number
  in_progress: number
  done: number
  completion_rate: number
}

export interface PaginationMeta {
  total: number
  limit: number
  offset: number
}

export interface CreateTaskInput {
  title: string
  description?: string
  priority?: TaskPriority
}

export interface UpdateTaskInput {
  title?: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
}

export interface ListTasksParams {
  status?: TaskStatus
  priority?: TaskPriority
  limit?: number
  offset?: number
}

export interface ApiErrorBody {
  code: string
  message: string
}
