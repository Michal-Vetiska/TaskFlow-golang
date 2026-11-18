import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input, Label, Select, Textarea } from '../ui/Input'
import type { Task, TaskPriority, TaskStatus } from '../../types/task'
import { useCreateTask, useUpdateTask } from '../../hooks/useTaskMutations'
import { ApiError } from '../../lib/api'

interface TaskModalProps {
  open: boolean
  onClose: () => void
  task?: Task | null
}

export function TaskModal({ open, onClose, task }: TaskModalProps) {
  const isEdit = Boolean(task)
  const createMutation = useCreateTask()
  const updateMutation = useUpdateTask()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTitle(task?.title ?? '')
    setDescription(task?.description ?? '')
    setStatus(task?.status ?? 'todo')
    setPriority(task?.priority ?? 'medium')
    setError(null)
  }, [open, task])

  const loading = createMutation.isPending || updateMutation.isPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) {
      setError('Title is required')
      return
    }
    if (trimmed.length > 120) {
      setError('Title must be at most 120 characters')
      return
    }

    try {
      if (isEdit && task) {
        await updateMutation.mutateAsync({
          id: task.id,
          input: { title: trimmed, description, status, priority },
        })
      } else {
        await createMutation.mutateAsync({
          title: trimmed,
          description,
          priority,
        })
      }
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Uložení selhalo')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Upravit úkol' : 'Nový úkol'}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
            Zrušit
          </Button>
          <Button type="submit" form="task-form" disabled={loading}>
            {loading ? 'Ukládám…' : 'Uložit'}
          </Button>
        </>
      }
    >
      <form id="task-form" className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="Např. Learn Go interfaces"
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Volitelný popis úkolu"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {isEdit ? (
            <div>
              <Label htmlFor="status">Status</Label>
              <Select id="status" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </Select>
            </div>
          ) : null}
          <div className={isEdit ? '' : 'sm:col-span-2'}>
            <Label htmlFor="priority">Priority</Label>
            <Select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </div>
        </div>
        {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
      </form>
    </Modal>
  )
}
