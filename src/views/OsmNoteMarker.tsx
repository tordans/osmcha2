import { useEffect } from 'react'
import { Marker, type MarkerEvent } from 'react-map-gl/maplibre'
import { ChatBubbleLeftIcon } from '../components/ui/icons.ts'
import { useOsmNoteActions, useOsmNoteMarker } from '../stores/osm-note-store.ts'

/**
 * The temporary marker "Show on map" of the OSM note quick view puts on the map. Tapping it
 * opens the quick view again. Render inside `<Map>`; it goes away when the changeset changes.
 */
export function OsmNoteMarker({ changesetId }: { changesetId: number | null }) {
  const marker = useOsmNoteMarker()
  const { openNote, clearMarker } = useOsmNoteActions()

  useEffect(
    function clearMarkerWhenChangesetChanges() {
      return clearMarker
    },
    [changesetId, clearMarker],
  )

  if (!marker) return null
  return (
    <Marker
      latitude={marker.lat}
      longitude={marker.lng}
      anchor="center"
      onClick={(event: MarkerEvent<MouseEvent>) => {
        // The marker sits inside the map; do not also click the map under it.
        event.originalEvent.stopPropagation()
        openNote(marker.id)
      }}
    >
      <button
        type="button"
        aria-label={`OSM note #${marker.id}, show details`}
        className="flex size-11 cursor-pointer touch-manipulation items-center justify-center rounded-full"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-amber-500 text-white shadow-md ring-2 ring-white">
          <ChatBubbleLeftIcon className="size-5" aria-hidden />
        </span>
      </button>
    </Marker>
  )
}
