import { Button } from './Button'

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-6 text-center">
      <p className="text-sm text-rose-700 dark:text-rose-300">{message}</p>
      {onRetry ? (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Zkusit znovu
        </Button>
      ) : null}
    </div>
  )
}
