import { useState } from 'react'
import { Marker, useMap, type MarkerDragEvent } from 'react-map-gl/maplibre'
import { PinNumberBadge } from '../components/changeset/PinNumberBadge.tsx'
import { Button } from '../components/ui/button.tsx'
import { flyoutSurfaceClassName } from '../components/ui/flyout.ts'
import { useChangesetNumberedPins } from '../notes/changesetPins.ts'
import { useNotesUserKey } from '../notes/useNotesUserKey.ts'
import type { PinParam } from '../routing/pinParam.ts'
import { getChangesetNotesActions, usePinPlacement } from '../stores/changeset-notes-store.ts'
import { isMobile } from '../utils/isMobile.ts'
import { CHANGESET_MAP_ID } from './changesetAdiffViewer.ts'
import { suppressNextMapClick } from './suppressMapClick.ts'

export function PinPlacementOverlay() {
  const placement = usePinPlacement()
  const { [CHANGESET_MAP_ID]: mapRef } = useMap()
  if (!placement) return null

  function setPinHere() {
    const map = mapRef?.getMap()
    if (!map) return
    const center = map.getCenter()
    getChangesetNotesActions().placePin({ lat: center.lat, lng: center.lng })
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-8 z-20 flex justify-center px-3">
      <div
        className={`pointer-events-auto flex max-w-md flex-col items-center gap-2 rounded-lg px-3 py-2 text-center text-sm text-zinc-800 ${flyoutSurfaceClassName}`}
      >
        <p>
          {isMobile()
            ? 'Pan the map, then set the pin at the centre.'
            : 'Click the map to place this pin.'}
        </p>
        {isMobile() ? (
          <Button type="button" color="blue" onClick={setPinHere}>
            Set pin here
          </Button>
        ) : null}
        <Button
          type="button"
          outline
          onClick={() => getChangesetNotesActions().setPinPlacement(null)}
        >
          Cancel
        </Button>
      </div>
      {isMobile() ? (
        <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-2xl text-red-600">
          +
        </div>
      ) : null}
    </div>
  )
}

export function ChangesetPinMarkers({ changesetId }: { changesetId: number | null }) {
  const userKey = useNotesUserKey()
  const numbered = useChangesetNumberedPins(changesetId)
  if (changesetId == null) return null
  return (
    <>
      {numbered.map((item) => (
        <PinNumberMarker
          key={item.id ?? `${item.number}-${item.pin.lat}-${item.pin.lng}`}
          lat={item.pin.lat}
          lng={item.pin.lng}
          number={item.number}
          draft={item.draft}
          onMove={
            item.draft && item.id
              ? (pin) => {
                  const noteId = item.id
                  if (!noteId) return
                  getChangesetNotesActions().setDraftPin(userKey, changesetId, noteId, pin)
                }
              : undefined
          }
        />
      ))}
    </>
  )
}

function PinNumberMarker({
  lat,
  lng,
  number,
  draft,
  onMove,
}: {
  lat: number
  lng: number
  number: number
  draft?: boolean
  onMove?: (pin: PinParam) => void
}) {
  const [live, setLive] = useState<PinParam | null>(null)
  const display = live ?? { lat, lng }
  const movable = Boolean(draft && onMove)

  function handleDrag(event: MarkerDragEvent) {
    setLive({ lat: event.lngLat.lat, lng: event.lngLat.lng })
  }

  function handleDragEnd(event: MarkerDragEvent) {
    const pin = { lat: event.lngLat.lat, lng: event.lngLat.lng }
    setLive(null)
    suppressNextMapClick()
    onMove?.(pin)
  }

  return (
    <Marker
      latitude={display.lat}
      longitude={display.lng}
      anchor="bottom"
      draggable={movable}
      onDrag={movable ? handleDrag : undefined}
      onDragEnd={movable ? handleDragEnd : undefined}
      style={{ cursor: movable ? 'grab' : undefined }}
    >
      <PinNumberBadge number={number} draft={draft} />
    </Marker>
  )
}
