import type { Map as MaplibreMap } from 'maplibre-gl'

/** Expose the MapLibre instance for agents. Production builds skip this. */
export function exposeMainMapForDebugging(map: MaplibreMap) {
  if (!import.meta.env.DEV) return
  window.__mainMap = map
}

export function clearMainMapDebugExposure() {
  if (!import.meta.env.DEV) return
  delete window.__mainMap
}
