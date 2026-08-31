import bbox from '@turf/bbox'
import type { LngLatLike, Map } from 'maplibre-gl'
import { parseMapParam, type MapParam } from '../routing/mapParam.ts'
import type { PinParam } from '../routing/pinParam.ts'
import type { ChangesetAdiffViewer } from './changesetAdiffViewer.ts'
import type { LngLatBoundsTuple } from './changesetViewBounds.ts'

type ChangesetCameraIntent = { type: 'restore'; camera: MapParam } | { type: 'fit' }

const MIN_PADDING_PX = 16
const MAX_PADDING_PX = 80
const MAX_FIT_ZOOM = 18

/** Missing `?map=` means fit this changeset; a parsed value is an explicit viewport. */
export function changesetCameraIntent(mapSearch: string | undefined) {
  const camera = parseMapParam(mapSearch ?? '')
  const intent: ChangesetCameraIntent = camera ? { type: 'restore', camera } : { type: 'fit' }
  return intent
}

/** Padding that always leaves a usable viewport; `200px` overflows typical review panes. */
export function changesetFitPadding(width: number, height: number) {
  const minSide = Math.min(width, height)
  if (minSide < 8) return null
  const desired = Math.floor(minSide * 0.12)
  const padding = Math.max(MIN_PADDING_PX, Math.min(MAX_PADDING_PX, desired))
  const maxPad = Math.max(0, Math.floor(minSide / 2) - 4)
  if (maxPad < 1) return 0
  return Math.min(padding, maxPad)
}

export function changesetFitOptions(width: number, height: number) {
  const padding = changesetFitPadding(width, height)
  if (padding == null) return null
  return { padding, maxZoom: MAX_FIT_ZOOM }
}

export function jumpMapToChangesetBounds(map: Map, bounds: LngLatBoundsTuple) {
  const container = map.getContainer()
  const options = changesetFitOptions(container.clientWidth, container.clientHeight)
  if (!options) return false
  const camera = map.cameraForBounds(bounds, options)
  if (!camera) return false
  map.jumpTo(camera)
  return true
}

function pinPointFeature(pin: PinParam) {
  const feature: GeoJSON.Feature = {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Point', coordinates: [pin.lng, pin.lat] },
  }
  return feature
}

/** Min zoom gain before list selection uses pan-then-zoom instead of one fly. */
const STAGED_ZOOM_DELTA = 2
/** Fraction of the animation used to finish the pan (zoom lags behind). */
const PAN_PHASE_END = 0.5
/** When zoom interpolation begins (overlap with pan keeps motion continuous). */
const ZOOM_PHASE_START = 0.28

type StagedFlyPlan = { type: 'direct' } | { type: 'staged' }

/**
 * When zooming in a lot, prefer a continuous pan-then-zoom path over one fly —
 * simultaneous pan+zoom loses continuity from a zoomed-out overview.
 */
export function stagedFlyPlan(fromZoom: number, toZoom: number) {
  if (toZoom - fromZoom < STAGED_ZOOM_DELTA) return { type: 'direct' }
  return { type: 'staged' }
}

/** Bumps when a new fly starts so an older rAF loop exits. */
let stagedFlyGeneration = 0
/** True while the custom pan-then-zoom rAF loop is driving the camera. */
let cameraAnimating = false

/** Skip URL `?map=` writes for intermediate jumpTo frames of the staged camera. */
export function isChangesetCameraAnimating() {
  return cameraAnimating
}

type FlyFitOptions = {
  /** List clicks from a zoomed-out view: continuous pan, then zoom (no mid stop). */
  staged?: boolean
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function clamp01(t: number) {
  return Math.min(1, Math.max(0, t))
}

function lngLatOf(center: LngLatLike) {
  if (Array.isArray(center)) return { lng: center[0]!, lat: center[1]! }
  if ('lon' in center) return { lng: center.lon, lat: center.lat }
  return { lng: center.lng, lat: center.lat }
}

function cameraAnimationDuration(fromZoom: number, toZoom: number, panDistancePx: number) {
  const zoomDelta = Math.abs(toZoom - fromZoom)
  return Math.min(2200, Math.max(900, 500 + zoomDelta * 260 + panDistancePx * 0.35))
}

/**
 * One continuous animation: pan first, then zoom in.
 * Avoids the hitch of chaining two MapLibre flyTo calls.
 */
function animatePanThenZoom(
  map: Map,
  nextCamera: { center: LngLatLike; zoom?: number; bearing?: number; pitch?: number },
  generation: number,
) {
  const from = map.getCenter()
  const fromZoom = map.getZoom()
  const to = lngLatOf(nextCamera.center)
  const toZoom = typeof nextCamera.zoom === 'number' ? nextCamera.zoom : fromZoom
  const bearing = nextCamera.bearing ?? map.getBearing()
  const pitch = nextCamera.pitch ?? map.getPitch()

  const projectedFrom = map.project(from)
  const projectedTo = map.project(to)
  const panDistancePx = Math.hypot(projectedTo.x - projectedFrom.x, projectedTo.y - projectedFrom.y)
  const duration = cameraAnimationDuration(fromZoom, toZoom, panDistancePx)
  const startedAt = performance.now()
  cameraAnimating = true

  function frame(now: number) {
    if (generation !== stagedFlyGeneration) return

    const t = clamp01((now - startedAt) / duration)
    const panT = easeInOutCubic(clamp01(t / PAN_PHASE_END))
    const zoomT = easeInOutCubic(clamp01((t - ZOOM_PHASE_START) / (1 - ZOOM_PHASE_START)))
    const center: [number, number] = [lerp(from.lng, to.lng, panT), lerp(from.lat, to.lat, panT)]
    const zoom = lerp(fromZoom, toZoom, zoomT)

    if (t < 1) {
      map.jumpTo({ center, zoom, bearing, pitch })
      requestAnimationFrame(frame)
      return
    }

    // Clear before the last jumpTo so onMoveEnd can write the final ?map=.
    cameraAnimating = false
    map.jumpTo({ center, zoom, bearing, pitch })
  }

  requestAnimationFrame(frame)
}

function flyMapToFitFeatures(map: Map, features: GeoJSON.Feature[], options: FlyFitOptions = {}) {
  if (features.length === 0) return false
  const raw = bbox({ type: 'FeatureCollection', features })
  const west = raw[0]
  const south = raw[1]
  const east = raw.length === 6 ? raw[3] : raw[2]
  const north = raw.length === 6 ? raw[4] : raw[3]
  if (![west, south, east, north].every(Number.isFinite)) return false
  const bounds: LngLatBoundsTuple = [west, south, east, north]
  const nextCamera = map.cameraForBounds(bounds, {
    padding: 50,
    maxZoom: 18,
  })
  if (!nextCamera || nextCamera.center == null) return false

  const generation = ++stagedFlyGeneration
  cameraAnimating = false

  const toZoom = typeof nextCamera.zoom === 'number' ? nextCamera.zoom : map.getZoom()
  const plan = options.staged
    ? stagedFlyPlan(map.getZoom(), toZoom)
    : ({ type: 'direct' } satisfies StagedFlyPlan)

  if (plan.type === 'staged') {
    animatePanThenZoom(
      map,
      {
        center: nextCamera.center,
        zoom: toZoom,
        bearing: nextCamera.bearing,
      },
      generation,
    )
    return true
  }

  map.flyTo(nextCamera)
  return true
}

/** Features to fit for an object `ref` and/or a pin. Pin-only notes have no ref. */
export function featuresToFitForNote(
  viewer: { geojson: GeoJSON.FeatureCollection },
  ref: { type: string; id: number } | null,
  pin?: PinParam | null,
) {
  const features = ref
    ? viewer.geojson.features.filter(
        (feature) => feature.properties?.type === ref.type && feature.properties?.id === ref.id,
      )
    : []
  return pin ? [...features, pinPointFeature(pin)] : features
}

/** Fly the camera to an element's features, optionally including a note pin. */
export function flyMapToAdiffElement(
  map: Map,
  viewer: ChangesetAdiffViewer,
  type: string,
  id: number,
  pin?: PinParam | null,
  options?: FlyFitOptions,
) {
  return flyMapToFitFeatures(map, featuresToFitForNote(viewer, { type, id }, pin), options)
}

/** Fly the camera to a pin-only note (no object `ref`). */
export function flyMapToPin(map: Map, pin: PinParam) {
  return flyMapToFitFeatures(map, [pinPointFeature(pin)])
}
