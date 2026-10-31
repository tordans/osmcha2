import type { Map } from 'maplibre-gl'
import { isDesktopLayout } from '../layout/useDesktopLayout.ts'
import { flyMapToPin } from './changesetCamera.ts'
import { moveReviewSheet, runReviewCamera } from './reviewCamera.ts'

/**
 * Fly the main map to a temporary marker ("Show on map" of a quick view).
 * Desktop: fly at once. Phone: slide the review sheet down to the map stop first, then fly with
 * the part of the map the sheet still covers kept free, so the marker is not hidden.
 */
export function flyToTemporaryPin(map: Map, position: { lat: number; lng: number }) {
  if (!isDesktopLayout()) moveReviewSheet('map')
  runReviewCamera((bottomInset) => {
    flyMapToPin(map, { lat: position.lat, lng: position.lng }, { bottomInset })
  })
}

/** The List and map buttons cover this much of the top of the map on a phone. */
const TOP_CHROME_PX = 64
const EDGE_MARGIN_PX = 32

/**
 * How far to pan so that `point` shows on the part of a map of `width` above `panelTop` (both px of
 * the map), or null when it already does. A point in view stays where it is.
 */
export function panToKeepVisible(
  point: { x: number; y: number },
  { width, panelTop }: { width: number; panelTop: number },
): [x: number, y: number] | null {
  const bottom = panelTop - EDGE_MARGIN_PX
  const fitsAcross = point.x >= EDGE_MARGIN_PX && point.x <= width - EDGE_MARGIN_PX
  const fitsDown = point.y >= TOP_CHROME_PX && point.y <= bottom
  if (fitsAcross && fitsDown) return null
  return [
    fitsAcross ? 0 : point.x - width / 2,
    fitsDown ? 0 : point.y - (TOP_CHROME_PX + bottom) / 2,
  ]
}

/** Phones: a panel covers the lower map. Keep `position` on what shows above it; the zoom stays. */
export function keepInViewAbovePanel(
  map: Map,
  position: { lng: number; lat: number },
  panelTopOnScreen: number,
) {
  const canvas = map.getCanvas().getBoundingClientRect()
  const pan = panToKeepVisible(map.project(position), {
    width: canvas.width,
    panelTop: panelTopOnScreen - canvas.top,
  })
  if (pan) map.panBy(pan)
}
