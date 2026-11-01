import { useState } from 'react'
import { toast } from 'sonner'
import { useStreetImageryViewerActions } from '../../stores/street-imagery-viewer-store.ts'
import { photoPlaceOf } from '../street_imagery/photoPlace.ts'
import { CameraIcon, LoaderCircleIcon } from '../ui/icons.ts'
import { ReviewIconButton } from './AddNoteButton.tsx'
import type { ElementChange } from './changesetElements.ts'

/** Opens the street photos that look at a change. Asks Mapillary on click only. */
export function PhotosOfPlaceButton({ change }: { change: ElementChange }) {
  const { openPlacePhotos } = useStreetImageryViewerActions()
  const [loading, setLoading] = useState(false)
  const place = photoPlaceOf(change)
  if (!place) return null
  const start = place

  async function findPhotos() {
    if (loading) return
    setLoading(true)
    try {
      const { findPhotosLookingAt } = await import('../street_imagery/streetImageryPlacePhotos.ts')
      const [first, ...rest] = await findPhotosLookingAt(start)
      if (first) openPlacePhotos([first, ...rest])
      else toast('No street photos look at this place.')
    } catch {
      toast.error('Could not load the street photos.')
    } finally {
      setLoading(false)
    }
  }

  const label = `Street photos looking at ${change.type}/${change.id}`
  return (
    <ReviewIconButton
      label={label}
      tooltip={
        change.type === 'way'
          ? 'Street photos of the start of this line'
          : 'Street photos of this place'
      }
      pressed={false}
      tone="note"
      rounded="md"
      onClick={() => void findPhotos()}
    >
      {loading ? (
        <LoaderCircleIcon className="size-3.5 animate-spin" />
      ) : (
        <CameraIcon className="size-3.5" />
      )}
    </ReviewIconButton>
  )
}
