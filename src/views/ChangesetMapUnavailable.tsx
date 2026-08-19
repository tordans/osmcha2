import { Button } from '../components/ui/button.tsx'
import { changesetMapErrorCopy } from './changesetMapError.ts'

export function ChangesetMapUnavailable({
  error,
  onRetry,
}: {
  error: unknown
  onRetry: () => void
}) {
  const copy = changesetMapErrorCopy(error)
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/40 p-4">
      <div className="max-w-md rounded-lg bg-white px-4 py-3 text-center shadow-sm ring-1 ring-zinc-950/10">
        <h2 className="text-lg font-semibold text-zinc-950">{copy.title}</h2>
        <p className="mt-2 text-sm text-zinc-600">{copy.description}</p>
        <Button className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </div>
  )
}
