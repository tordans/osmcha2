import type { Map } from 'maplibre-gl'
import { useEffect, useState } from 'react'
import type { MapParam } from '../routing/mapParam.ts'

/** The map's camera (centre and zoom), new after each move has ended. */
export function useMapCamera(map: Map | undefined) {
  const [camera, setCamera] = useState<MapParam | null>(null)

  useEffect(
    function followMapCamera() {
      if (!map) return
      function readCamera() {
        const { lng, lat } = map!.getCenter()
        setCamera({ zoom: map!.getZoom(), lat, lng })
      }
      readCamera()
      map.on('moveend', readCamera)
      return function stopFollowingMapCamera() {
        map.off('moveend', readCamera)
      }
    },
    [map],
  )

  return camera
}
