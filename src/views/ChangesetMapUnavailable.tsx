import { Button } from '../components/ui/button.tsx'
import { changesetMapErrorCopy } from './changesetMapError.ts'

export function ChangesetMapUnavailable({
  error,
  overpassFailed = false,
  onRetry,
  onLoadFromOverpass,
}: {
  error: unknown
  /** The Overpass query failed; the copy then names Overpass instead of the adiff service. */
  overpassFailed?: boolean
  onRetry: () => void
  /** Only set when the adiff service has no diff. Overpass is never queried without this click. */
  onLoadFromOverpass?: () => void
}) {
  const copy = unavailableCopy({ error, overpassFailed, offerOverpass: !!onLoadFromOverpass })
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/40 p-4">
      <div className="max-w-md rounded-lg bg-white px-4 py-3 text-center shadow-sm ring-1 ring-zinc-950/10">
        <h2 className="text-lg font-semibold text-zinc-950">{copy.title}</h2>
        <p className="mt-2 text-sm text-zinc-600">{copy.description}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button onClick={onRetry}>Retry</Button>
          {onLoadFromOverpass ? (
            <Button outline onClick={onLoadFromOverpass}>
              Load from Overpass
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function unavailableCopy({
  error,
  overpassFailed,
  offerOverpass,
}: {
  error: unknown
  overpassFailed: boolean
  offerOverpass: boolean
}): { title: string; description: string } {
  if (overpassFailed) {
    const message = error instanceof Error ? error.message : ''
    return {
      title: 'Could not load the changeset map from Overpass',
      description: message || 'Try again. If this keeps happening, the Overpass API may be busy.',
    }
  }
  if (offerOverpass) {
    return {
      title: 'Map data is not ready yet',
      description:
        'No augmented diff is available for this changeset yet. It may still be processing. You can load the data from Overpass instead, which is slower.',
    }
  }
  return changesetMapErrorCopy(error)
}
