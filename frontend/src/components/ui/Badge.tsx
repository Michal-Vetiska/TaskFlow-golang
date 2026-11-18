import type { TaskPriority, TaskStatus } from '../../types/task'
import { priorityLabel, statusLabel } from '../../lib/format'

const statusStyles: Record<TaskStatus, string> = {
  todo: 'bg-slate-500/15 text-slate-700 dark:text-slate-200',
  in_progress: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  done: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
}

const priorityStyles: Record<TaskPriority, string> = {
  low: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  medium: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  high: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}>
      {statusLabel(status)}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityStyles[priority]}`}>
      {priorityLabel(priority)}
    </span>
  )
}
