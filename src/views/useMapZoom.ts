import { useSyncExternalStore } from 'react'
import { useMap } from 'react-map-gl/maplibre'

/** The map zoom, read again when a move ends. */
export function useMapZoom(mapId: string) {
  const map = useMap()[mapId]?.getMap()
  return useSyncExternalStore(
    (onChange) => {
      map?.on('moveend', onChange)
      return () => {
        map?.off('moveend', onChange)
      }
    },
    () => map?.getZoom() ?? 0,
  )
}
