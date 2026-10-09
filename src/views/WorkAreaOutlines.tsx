import { useSyncExternalStore } from 'react'
import { Layer, Marker, Source, useMap } from 'react-map-gl/maplibre'
import { workAreaOutlines, type WorkArea } from './changesetWorkAreas.ts'
import { suppressNextMapClick } from './suppressMapClick.ts'

const WORK_AREA_SOURCE_ID = 'changeset-work-areas'
/** Fuchsia: not an action color, not selection yellow, not pin blue. */
const WORK_AREA_COLOR = '#c026d3'

/**
 * "The work is in here": a thin line with a wide translucent band around each
 * work area, plus a tab that jumps to it.
 */
export function WorkAreaOutlines({
  areas,
  beforeId,
  onJump,
}: {
  areas: readonly WorkArea[]
  beforeId?: string
  onJump: (area: WorkArea) => void
}) {
  const { current: map } = useMap()

  function subscribe(notify: () => void) {
    if (!map) return () => {}
    map.on('zoom', notify)
    return function unsubscribeFromZoom() {
      map.off('zoom', notify)
    }
  }

  const zoom = useSyncExternalStore(subscribe, () => map?.getZoom() ?? 0)
  const outlines = workAreaOutlines(areas, zoom)

  return (
    <>
      <Source id={WORK_AREA_SOURCE_ID} type="geojson" data={outlines}>
        <Layer
          id="changeset-work-area-band"
          type="line"
          beforeId={beforeId}
          layout={{ 'line-join': 'round' }}
          paint={{ 'line-color': WORK_AREA_COLOR, 'line-width': 12, 'line-opacity': 0.2 }}
        />
        <Layer
          id="changeset-work-area-line"
          type="line"
          beforeId={beforeId}
          layout={{ 'line-join': 'round' }}
          paint={{ 'line-color': WORK_AREA_COLOR, 'line-width': 1.5 }}
        />
      </Source>
      {outlines.features.map((outline, index) => {
        const area = areas[index]
        const corner = outline.geometry.coordinates[0]?.[0]
        if (!area || !corner) return null
        return (
          <Marker key={area.id} longitude={corner[0]!} latitude={corner[1]!} anchor="bottom-left">
            <button
              type="button"
              aria-label={`Jump to area ${area.id}`}
              // The map would read this click as "clicked empty map" and drop the selection.
              onPointerDown={suppressNextMapClick}
              onClick={() => onJump(area)}
              className="-ml-1.5 cursor-pointer touch-manipulation rounded-t-md bg-fuchsia-600 px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap text-white select-none hover:bg-fuchsia-700"
            >
              Area {area.id}
            </button>
          </Marker>
        )
      })}
    </>
  )
}
