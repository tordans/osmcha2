import bbox from '@turf/bbox'
import type { Map } from 'maplibre-gl'
import { parseMapParam, type MapParam } from '../routing/mapParam.ts'
import type { PinParam } from '../routing/pinParam.ts'
import type { ChangesetAdiffViewer } from './changesetAdiffViewer.ts'
import type { LngLatBoundsTuple } from './changesetViewBounds.ts'

export type ChangesetCameraIntent = { type: 'restore'; camera: MapParam } | { type: 'fit' }

const MIN_PADDING_PX = 16
const MAX_PADDING_PX = 80
const MAX_FIT_ZOOM = 18

/** Missing `?map=` means fit this changeset; a parsed value is an explicit viewport. */
export function changesetCameraIntent(mapSearch: string | undefined): ChangesetCameraIntent {
  const camera = parseMapParam(mapSearch ?? '')
  return camera ? { type: 'restore', camera } : { type: 'fit' }
}

/** Padding that always leaves a usable viewport; `200px` overflows typical review panes. */
export function changesetFitPadding(width: number, height: number): number | null {
  const minSide = Math.min(width, height)
  if (minSide < 8) return null
  const desired = Math.floor(minSide * 0.12)
  const padding = Math.max(MIN_PADDING_PX, Math.min(MAX_PADDING_PX, desired))
  const maxPad = Math.max(0, Math.floor(minSide / 2) - 4)
  if (maxPad < 1) return 0
  return Math.min(padding, maxPad)
}

export function changesetFitOptions(
  width: number,
  height: number,
): { padding: number; maxZoom: number } | null {
  const padding = changesetFitPadding(width, height)
  if (padding == null) return null
  return { padding, maxZoom: MAX_FIT_ZOOM }
}

export function jumpMapToChangesetBounds(map: Map, bounds: LngLatBoundsTuple): boolean {
  const container = map.getContainer()
  const options = changesetFitOptions(container.clientWidth, container.clientHeight)
  if (!options) return false
  const camera = map.cameraForBounds(bounds, options)
  if (!camera) return false
  map.jumpTo(camera)
  return true
}

function pinPointFeature(pin: PinParam): GeoJSON.Feature {
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Point', coordinates: [pin.lng, pin.lat] },
  }
}

function jumpMapToFitFeatures(map: Map, features: GeoJSON.Feature[]): boolean {
  if (features.length === 0) return false
  let bounds = bbox({ type: 'FeatureCollection', features })
  if (bounds.length === 6) {
    bounds = [bounds[0], bounds[1], bounds[3], bounds[4]]
  }
  const nextCamera = map.cameraForBounds(bounds as [number, number, number, number], {
    padding: 50,
    maxZoom: 18,
  })
  if (!nextCamera) return false
  map.jumpTo(nextCamera)
  return true
}

/** Features to fit for an object `ref` and/or a pin. Pin-only notes have no ref. */
export function featuresToFitForNote(
  viewer: { geojson: GeoJSON.FeatureCollection },
  ref: { type: string; id: number } | null,
  pin?: PinParam | null,
): GeoJSON.Feature[] {
  const features = ref
    ? viewer.geojson.features.filter(
        (feature) => feature.properties?.type === ref.type && feature.properties?.id === ref.id,
      )
    : []
  return pin ? [...features, pinPointFeature(pin)] : features
}

/** Fit the camera to an element's features, optionally including a note pin. */
export function jumpMapToAdiffElement(
  map: Map,
  viewer: ChangesetAdiffViewer,
  type: string,
  id: number,
  pin?: PinParam | null,
): boolean {
  return jumpMapToFitFeatures(map, featuresToFitForNote(viewer, { type, id }, pin))
}

/** Fit the camera to a pin-only note (no object `ref`). */
export function jumpMapToPin(map: Map, pin: PinParam): boolean {
  return jumpMapToFitFeatures(map, [pinPointFeature(pin)])
}
