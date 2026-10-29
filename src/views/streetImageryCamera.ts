import type { Map } from 'maplibre-gl'
import type { StreetImageryRef } from '../components/street_imagery/streetImageryTags.ts'
import { isDesktopLayout } from '../layout/useDesktopLayout.ts'
import { getStreetImageryViewerActions } from '../stores/street-imagery-viewer-store.ts'
import { flyMapToPin } from './changesetCamera.ts'
import { moveReviewSheet, runReviewCamera } from './reviewCamera.ts'

type PhotoPosition = StreetImageryRef & { lat: number; lng: number }

/**
 * Put a temporary marker on the photo and fly the main map to it.
 * Desktop: fly at once. Phone: slide the review sheet down to the map stop first, then fly with
 * the part of the map the sheet still covers kept free, so the marker is not hidden.
 */
export function showStreetImageryPhotoOnMap(map: Map, photo: PhotoPosition) {
  getStreetImageryViewerActions().showMarker(photo)
  if (!isDesktopLayout()) moveReviewSheet('map')
  runReviewCamera((bottomInset) => {
    flyMapToPin(map, { lat: photo.lat, lng: photo.lng }, { bottomInset })
  })
}
