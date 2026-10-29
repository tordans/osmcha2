import { useEffect } from 'react'
import { Marker, type MarkerEvent } from 'react-map-gl/maplibre'
import { STREET_IMAGERY_PROVIDER_LABEL } from '../components/street_imagery/streetImageryTags.ts'
import { CameraIcon } from '../components/ui/icons.ts'
import {
  useStreetImageryMarker,
  useStreetImageryViewerActions,
} from '../stores/street-imagery-viewer-store.ts'

/**
 * The temporary marker "Show on map" of the street photo viewer puts on the map. Tapping it opens
 * the viewer again. Render inside `<Map>`; it goes away when the changeset changes.
 */
export function StreetImageryPhotoMarker({ changesetId }: { changesetId: number | null }) {
  const marker = useStreetImageryMarker()
  const { openPhoto, clearMarker } = useStreetImageryViewerActions()

  useEffect(
    function clearMarkerWhenChangesetChanges() {
      return clearMarker
    },
    [changesetId, clearMarker],
  )

  if (!marker) return null
  const label = STREET_IMAGERY_PROVIDER_LABEL[marker.provider]
  return (
    <Marker
      latitude={marker.lat}
      longitude={marker.lng}
      anchor="center"
      onClick={(event: MarkerEvent<MouseEvent>) => {
        // The marker sits inside the map; do not also click the map under it.
        event.originalEvent.stopPropagation()
        openPhoto({ provider: marker.provider, id: marker.id })
      }}
    >
      <button
        type="button"
        aria-label={`${label} photo ${marker.id}, show photo`}
        className="flex size-11 cursor-pointer touch-manipulation items-center justify-center rounded-full"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-sky-600 text-white shadow-md ring-2 ring-white">
          <CameraIcon className="size-5" aria-hidden />
        </span>
      </button>
    </Marker>
  )
}
