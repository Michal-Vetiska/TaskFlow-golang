import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useDeleteTask } from '../../hooks/useTaskMutations'
import { ApiError } from '../../lib/api'
import { useState } from 'react'
import type { Task } from '../../types/task'

interface DeleteConfirmDialogProps {
  open: boolean
  task: Task | null
  onClose: () => void
}

export function DeleteConfirmDialog({ open, task, onClose }: DeleteConfirmDialogProps) {
  const deleteMutation = useDeleteTask()
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (!task) return
    setError(null)
    try {
      await deleteMutation.mutateAsync(task.id)
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Smazání selhalo')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Smazat úkol?"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={deleteMutation.isPending}>
            Zrušit
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Mažu…' : 'Smazat'}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-muted">
        Opravdu chcete smazat úkol <span className="font-medium text-ink">{task?.title}</span>? Tuto
        akci nelze vrátit.
      </p>
      {error ? <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
    </Modal>
  )
}
