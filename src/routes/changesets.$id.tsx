import { createFileRoute, notFound, type ErrorComponentProps } from '@tanstack/react-router'
import { z } from 'zod'
import { Loading } from '../components/loading.tsx'
import { Button } from '../components/ui/button.tsx'
import { changesetMapQueryOptions, changesetQueryOptions } from '../query/options/changeset.ts'
import { Changeset } from '../views/changeset.tsx'

export const Route = createFileRoute('/changesets/$id')({
  params: {
    parse: (raw) => z.object({ id: z.coerce.number().int().positive() }).parse(raw),
    stringify: ({ id }) => ({ id: String(id) }),
  },
  validateSearch: z.object({
    map: z.string().optional(),
  }),
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(changesetQueryOptions(params.id))
    } catch (error) {
      if (error instanceof Error && /not found/i.test(error.message)) {
        throw notFound()
      }
      throw error
    }

    try {
      await context.queryClient.ensureQueryData(changesetMapQueryOptions(params.id))
    } catch {
      // Review pane still loads; CMap shows retry UI when the adiff is missing.
    }
  },
  pendingComponent: ChangesetPending,
  notFoundComponent: ChangesetNotFound,
  errorComponent: ChangesetLoadError,
  component: Changeset,
})

function ChangesetPending() {
  return <Loading className="h-full" />
}

function ChangesetNotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-lg font-semibold text-zinc-950">Changeset not found</h1>
      <p className="text-sm text-zinc-600">
        This changeset does not exist or is no longer available.
      </p>
    </div>
  )
}

function ChangesetLoadError({ error, reset }: ErrorComponentProps) {
  const message = error instanceof Error ? error.message : 'Try reloading OSMCha.'
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-lg font-semibold text-zinc-950">Could not load this changeset</h1>
      <p className="text-sm text-zinc-600">{message}</p>
      <Button onClick={reset}>Retry</Button>
    </div>
  )
}
