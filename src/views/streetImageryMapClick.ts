import type { MapLayerMouseEvent } from 'maplibre-gl'

type PhotoClickHandler = (event: MapLayerMouseEvent) => boolean

let handler: PhotoClickHandler | null = null

/**
 * The street photo layer registers its click handler while it is on. The layer lives in a lazy
 * chunk with the street-imagery package; the map's click handler only asks this light module.
 */
export function setStreetImageryClickHandler(next: PhotoClickHandler | null) {
  handler = next
}

/**
 * Whether the click hit a photo of the street layer and opened it. `false` while the layer is off
 * or still loading. The map's click handler asks only after no changeset feature was hit, so a
 * changeset feature under the finger wins over a photo.
 */
export function openStreetImageryPhotoFromClick(event: MapLayerMouseEvent) {
  return handler?.(event) ?? false
}
