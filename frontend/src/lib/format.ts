import type { TaskPriority, TaskStatus } from '../types/task'

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export function statusLabel(status: TaskStatus): string {
  switch (status) {
    case 'todo':
      return 'To Do'
    case 'in_progress':
      return 'In Progress'
    case 'done':
      return 'Done'
  }
}

export function priorityLabel(priority: TaskPriority): string {
  switch (priority) {
    case 'low':
      return 'Low'
    case 'medium':
      return 'Medium'
    case 'high':
      return 'High'
  }
}
