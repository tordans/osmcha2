import clsx from 'clsx'
import { useEffect, type ComponentType } from 'react'
import { Marker, type MarkerEvent } from 'react-map-gl/maplibre'
import { STREET_IMAGERY_PROVIDER_LABEL } from '../components/street_imagery/streetImageryTags.ts'
import { CameraIcon, ChatBubbleLeftIcon } from '../components/ui/icons.ts'
import { useOsmNoteActions, useOsmNoteMarker } from '../stores/osm-note-store.ts'
import {
  useStreetImageryMarker,
  useStreetImageryViewerActions,
} from '../stores/street-imagery-viewer-store.ts'

type TemporaryPinMarkerProps = {
  lat: number
  lng: number
  label: string
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  dotClassName: string
  onOpen: () => void
}

/** Lives in the always mounted parent: a cleanup in the marker would run with the marker itself. */
function useClearOnChangesetChange(changesetId: number | null, clear: () => void) {
  useEffect(
    function clearMarkerWhenChangesetChanges() {
      return clear
    },
    [changesetId, clear],
  )
}

/** A marker that "Show on map" of a quick view puts on the map. Tapping it opens the quick view again. */
function TemporaryPinMarker({
  lat,
  lng,
  label,
  icon: Icon,
  dotClassName,
  onOpen,
}: TemporaryPinMarkerProps) {
  return (
    <Marker
      latitude={lat}
      longitude={lng}
      anchor="center"
      onClick={(event: MarkerEvent<MouseEvent>) => {
        // The marker sits inside the map; do not also click the map under it.
        event.originalEvent.stopPropagation()
        onOpen()
      }}
    >
      <button
        type="button"
        aria-label={label}
        className="group flex size-11 cursor-pointer touch-manipulation items-center justify-center rounded-full"
      >
        <span
          className={clsx(
            'flex size-8 items-center justify-center rounded-full text-white shadow-md ring-2 ring-white transition-transform duration-100 group-active:scale-90',
            dotClassName,
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
      </button>
    </Marker>
  )
}

/** The marker of the OSM note quick view. Render inside `<Map>`. */
export function OsmNoteMarker({ changesetId }: { changesetId: number | null }) {
  const marker = useOsmNoteMarker()
  const { openNote, clearMarker } = useOsmNoteActions()
  useClearOnChangesetChange(changesetId, clearMarker)
  if (!marker) return null
  return (
    <TemporaryPinMarker
      lat={marker.lat}
      lng={marker.lng}
      label={`OSM note #${marker.id}, show details`}
      icon={ChatBubbleLeftIcon}
      dotClassName="bg-amber-500"
      onOpen={() => openNote(marker.id)}
    />
  )
}

/** The marker of the street photo viewer. Render inside `<Map>`. */
export function StreetImageryPhotoMarker({ changesetId }: { changesetId: number | null }) {
  const marker = useStreetImageryMarker()
  const { openPhoto, clearMarker } = useStreetImageryViewerActions()
  useClearOnChangesetChange(changesetId, clearMarker)
  if (!marker) return null
  return (
    <TemporaryPinMarker
      lat={marker.lat}
      lng={marker.lng}
      label={`${STREET_IMAGERY_PROVIDER_LABEL[marker.provider]} photo ${marker.id}, show photo`}
      icon={CameraIcon}
      dotClassName="bg-sky-600"
      onOpen={() => openPhoto({ provider: marker.provider, id: marker.id })}
    />
  )
}
