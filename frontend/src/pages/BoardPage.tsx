import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Plus } from 'lucide-react'
import { useBoardTasks } from '../hooks/useTasks'
import { useUpdateTask } from '../hooks/useTaskMutations'
import { Button } from '../components/ui/Button'
import { PriorityBadge } from '../components/ui/Badge'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { Select } from '../components/ui/Input'
import { TaskModal } from '../components/tasks/TaskModal'
import { formatDate, statusLabel } from '../lib/format'
import { ApiError } from '../lib/api'
import type { Task, TaskStatus } from '../types/task'

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'done']

export function BoardPage() {
  const query = useBoardTasks()
  const updateMutation = useUpdateTask()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
    }
    for (const task of query.data ?? []) {
      map[task.status].push(task)
    }
    return map
  }, [query.data])

  const activeTask = (query.data ?? []).find((t) => t.id === activeId) ?? null

  async function moveTask(taskId: string, status: TaskStatus) {
    setError(null)
    try {
      await updateMutation.mutateAsync({ id: taskId, input: { status } })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Změna statusu selhala')
    }
  }

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const taskId = String(event.active.id)
    const overId = event.over?.id
    if (!overId) return

    const over = String(overId)
    const nextStatus = (COLUMNS.includes(over as TaskStatus)
      ? over
      : (query.data ?? []).find((t) => t.id === over)?.status) as TaskStatus | undefined

    const current = (query.data ?? []).find((t) => t.id === taskId)
    if (!nextStatus || !current || current.status === nextStatus) return
    await moveTask(taskId, nextStatus)
  }

  return (
    <div className="mx-auto max-w-7xl animate-fade-up space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-accent">Board</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
            Kanban board
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Přesunutí karty volá PATCH na Go API. Na mobilu použijte menu statusu.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Nový úkol
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      ) : query.isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col} className="skeleton h-72 animate-shimmer rounded-2xl" />
          ))}
        </div>
      ) : (query.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="Board je prázdný"
          description="Vytvořte úkol a přesouvejte ho mezi sloupci To Do, In Progress a Done."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Vytvořit úkol
            </Button>
          }
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={(e) => void onDragEnd(e)}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {COLUMNS.map((status) => (
              <BoardColumn
                key={status}
                status={status}
                tasks={tasksByStatus[status]}
                onEdit={setEditTask}
                onStatusChange={(taskId, next) => void moveTask(taskId, next)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} dragging overlay /> : null}
          </DragOverlay>
        </DndContext>
      )}

      <TaskModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <TaskModal open={Boolean(editTask)} task={editTask} onClose={() => setEditTask(null)} />
    </div>
  )
}

function BoardColumn({
  status,
  tasks,
  onEdit,
  onStatusChange,
}: {
  status: TaskStatus
  tasks: Task[]
  onEdit: (task: Task) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <section
      ref={setNodeRef}
      className={`min-h-72 rounded-2xl border border-line bg-surface-raised/80 p-3 shadow-soft transition ${
        isOver ? 'ring-2 ring-accent/40' : ''
      }`}
    >
      <header className="mb-3 flex items-center justify-between px-1">
        <h2 className="font-display text-sm font-semibold text-ink">{statusLabel(status)}</h2>
        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-ink-muted">
          {tasks.length}
        </span>
      </header>
      <div className="space-y-3">
        {tasks.map((task) => (
          <DraggableTaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </section>
  )
}

function DraggableTaskCard({
  task,
  onEdit,
  onStatusChange,
}: {
  task: Task
  onEdit: (task: Task) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })
  const style = {
    transform: CSS.Translate.toString(transform),
  }

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-40' : ''}>
      <TaskCard
        task={task}
        dragging={isDragging}
        dragHandleProps={{ ...listeners, ...attributes }}
        onEdit={() => onEdit(task)}
        onStatusChange={(status) => onStatusChange(task.id, status)}
      />
    </div>
  )
}

function TaskCard({
  task,
  dragging,
  overlay,
  dragHandleProps,
  onEdit,
  onStatusChange,
}: {
  task: Task
  dragging?: boolean
  overlay?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
  onEdit?: () => void
  onStatusChange?: (status: TaskStatus) => void
}) {
  return (
    <article
      className={`rounded-xl border border-line bg-surface p-3 shadow-soft ${
        overlay || dragging ? 'rotate-1 ring-2 ring-accent/30' : ''
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="font-medium leading-snug text-ink">{task.title}</h3>
        <div className="flex items-center gap-1">
          {onEdit ? (
            <Button variant="ghost" className="!px-1.5 !py-1" aria-label="Upravit" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          ) : null}
          {dragHandleProps ? (
            <button
              type="button"
              className="rounded-lg p-1 text-ink-subtle hover:bg-surface-muted hover:text-ink"
              aria-label="Přesunout"
              {...dragHandleProps}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
      <p className="mb-3 line-clamp-2 text-sm text-ink-muted">
        {task.description || 'Bez popisu'}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <PriorityBadge priority={task.priority} />
        <span className="text-xs text-ink-subtle">{formatDate(task.created_at)}</span>
      </div>
      {onStatusChange ? (
        <div className="mt-3">
          <label className="sr-only" htmlFor={`status-${task.id}`}>
            Změnit status
          </label>
          <Select
            id={`status-${task.id}`}
            value={task.status}
            onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
            aria-label={`Status úkolu ${task.title}`}
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </Select>
        </div>
      ) : null}
    </article>
  )
}
