import type { Map } from 'maplibre-gl'
import { useEffect, useState } from 'react'
import type { MapView } from './surroundingsBoxes.ts'

/** The map's current view, new after each move has ended. */
export function useMapView(map: Map | undefined) {
  const [view, setView] = useState<MapView | null>(null)

  useEffect(
    function followMapView() {
      if (!map) return
      function readView() {
        const bounds = map!.getBounds()
        const { lng, lat } = map!.getCenter()
        setView({
          box: {
            west: bounds.getWest(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            north: bounds.getNorth(),
          },
          center: [lng, lat],
          at: Date.now(),
        })
      }
      readView()
      map.on('moveend', readView)
      return function stopFollowingMapView() {
        map.off('moveend', readView)
      }
    },
    [map],
  )

  return view
}
