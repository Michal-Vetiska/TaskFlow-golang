import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTaskStats, useTasks } from '../hooks/useTasks'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { PriorityBadge, StatusBadge } from '../components/ui/Badge'
import { TaskModal } from '../components/tasks/TaskModal'
import { formatDate } from '../lib/format'

export function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false)
  const statsQuery = useTaskStats()
  const recentQuery = useTasks({ limit: 5, offset: 0 })

  const stats = statsQuery.data

  return (
    <div className="mx-auto max-w-6xl animate-fade-up space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-accent">Dashboard</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
            Přehled produktivity
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-muted">
            Statistiky vycházejí z agregovaného API endpointu, ne jen z první stránky úkolů.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Nový úkol
        </Button>
      </div>

      {statsQuery.isError ? (
        <ErrorState
          message={statsQuery.error.message}
          onRetry={() => void statsQuery.refetch()}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Celkem" value={stats?.total} loading={statsQuery.isLoading} />
          <StatCard label="To Do" value={stats?.todo} loading={statsQuery.isLoading} />
          <StatCard label="In Progress" value={stats?.in_progress} loading={statsQuery.isLoading} />
          <StatCard label="Done" value={stats?.done} loading={statsQuery.isLoading} />
        </div>
      )}

      <section className="rounded-2xl border border-line bg-surface-raised p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-ink">Progres dokončení</h2>
          <span className="text-sm font-medium text-accent">
            {statsQuery.isLoading ? '…' : `${stats?.completion_rate ?? 0}%`}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${stats?.completion_rate ?? 0}%` }}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface-raised p-5 shadow-soft">
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">Poslední úkoly</h2>
        {recentQuery.isError ? (
          <ErrorState message={recentQuery.error.message} onRetry={() => void recentQuery.refetch()} />
        ) : recentQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-14 animate-shimmer rounded-xl" />
            ))}
          </div>
        ) : recentQuery.data?.data.length === 0 ? (
          <p className="text-sm text-ink-muted">Zatím žádné úkoly. Vytvořte první.</p>
        ) : (
          <ul className="divide-y divide-line">
            {recentQuery.data?.data.map((task) => (
              <li key={task.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-ink">{task.title}</p>
                  <p className="text-xs text-ink-subtle">{formatDate(task.created_at)}</p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <TaskModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}

function StatCard({
  label,
  value,
  loading,
}: {
  label: string
  value?: number
  loading: boolean
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface-raised p-5 shadow-soft">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-ink">
        {loading ? '—' : (value ?? 0)}
      </p>
    </div>
  )
}
