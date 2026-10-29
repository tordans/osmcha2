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
