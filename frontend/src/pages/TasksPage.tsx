import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Input'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { PriorityBadge, StatusBadge } from '../components/ui/Badge'
import { TaskModal } from '../components/tasks/TaskModal'
import { DeleteConfirmDialog } from '../components/tasks/DeleteConfirmDialog'
import { formatDate } from '../lib/format'
import type { Task, TaskPriority, TaskStatus } from '../types/task'

const PAGE_SIZE = 10

export function TasksPage() {
  const [status, setStatus] = useState<TaskStatus | ''>('')
  const [priority, setPriority] = useState<TaskPriority | ''>('')
  const [offset, setOffset] = useState(0)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTask, setDeleteTask] = useState<Task | null>(null)

  const params = useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset,
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
    }),
    [offset, status, priority],
  )

  const query = useTasks(params)
  const total = query.data?.meta.total ?? 0
  const page = Math.floor(offset / PAGE_SIZE) + 1
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="mx-auto max-w-6xl animate-fade-up space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-accent">All Tasks</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
            Seznam úkolů
          </h1>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Nový úkol
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface-raised p-4 sm:flex-row">
        <Select
          aria-label="Filtr status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as TaskStatus | '')
            setOffset(0)
          }}
        >
          <option value="">Všechny statusy</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </Select>
        <Select
          aria-label="Filtr priority"
          value={priority}
          onChange={(e) => {
            setPriority(e.target.value as TaskPriority | '')
            setOffset(0)
          }}
        >
          <option value="">Všechny priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </Select>
      </div>

      {query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      ) : query.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-16 animate-shimmer rounded-xl" />
          ))}
        </div>
      ) : query.data?.data.length === 0 ? (
        <EmptyState
          title="Žádné úkoly"
          description="Pro zvolené filtry nejsou žádné výsledky, nebo ještě nemáte žádný úkol."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Vytvořit úkol
            </Button>
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface-raised shadow-soft">
            <div className="hidden grid-cols-[1.4fr_1fr_auto_auto_auto_auto] gap-3 border-b border-line px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-subtle md:grid">
              <span>Title</span>
              <span>Description</span>
              <span>Status</span>
              <span>Priority</span>
              <span>Created</span>
              <span>Actions</span>
            </div>
            <ul className="divide-y divide-line">
              {query.data?.data.map((task) => (
                <li
                  key={task.id}
                  className="grid gap-3 px-4 py-4 md:grid-cols-[1.4fr_1fr_auto_auto_auto_auto] md:items-center"
                >
                  <div>
                    <p className="font-medium text-ink">{task.title}</p>
                  </div>
                  <p className="truncate text-sm text-ink-muted">
                    {task.description || '—'}
                  </p>
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  <span className="text-sm text-ink-subtle">{formatDate(task.created_at)}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      className="!px-2"
                      aria-label={`Upravit ${task.title}`}
                      onClick={() => setEditTask(task)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="!px-2"
                      aria-label={`Smazat ${task.title}`}
                      onClick={() => setDeleteTask(task)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-ink-muted">
              Stránka {page} / {pageCount} · {total} celkem
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={offset === 0}
                onClick={() => setOffset((v) => Math.max(0, v - PAGE_SIZE))}
              >
                Předchozí
              </Button>
              <Button
                variant="secondary"
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => setOffset((v) => v + PAGE_SIZE)}
              >
                Další
              </Button>
            </div>
          </div>
        </>
      )}

      <TaskModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <TaskModal open={Boolean(editTask)} task={editTask} onClose={() => setEditTask(null)} />
      <DeleteConfirmDialog
        open={Boolean(deleteTask)}
        task={deleteTask}
        onClose={() => setDeleteTask(null)}
      />
    </div>
  )
}
