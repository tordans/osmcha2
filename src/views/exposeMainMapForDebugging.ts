import type { Map as MaplibreMap } from 'maplibre-gl'

function shouldExposeMainMap(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_PLAYWRIGHT_ENABLED === 'true'
}

/** Expose the MapLibre instance for agents and Playwright. Production builds skip this. */
export function exposeMainMapForDebugging(map: MaplibreMap) {
  if (!shouldExposeMainMap()) return
  window.__mainMap = map
}

export function clearMainMapDebugExposure() {
  if (!shouldExposeMainMap()) return
  delete window.__mainMap
}
