import type { ErrorComponentProps } from '@tanstack/react-router'
import { Loading } from '../components/loading.tsx'
import { Button } from '../components/ui/button.tsx'

export function ChangesetPending() {
  return <Loading className="h-full" />
}

export function ChangesetNotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-lg font-semibold text-zinc-950">Changeset not found</h1>
      <p className="text-sm text-zinc-600">
        This changeset does not exist or is no longer available.
      </p>
    </div>
  )
}

export function ChangesetLoadError({ error, reset }: ErrorComponentProps) {
  const message = error instanceof Error ? error.message : 'Try reloading OSMCha.'
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-lg font-semibold text-zinc-950">Could not load this changeset</h1>
      <p className="text-sm text-zinc-600">{message}</p>
      <Button onClick={reset}>Retry</Button>
    </div>
  )
}
