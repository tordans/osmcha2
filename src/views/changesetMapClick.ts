import type { Map, Point } from 'maplibre-gl'
import { isNoopAction, type AdiffAction } from '../components/changeset/changesetElements.ts'
import { isClickableMapFeature } from './spyglassOverlay.ts'

type PickableFeature = {
  id?: string | number
  geometry?: { type?: string } | null
  properties?: { type?: string; id?: number; action?: string } | null
}

const HIT_SLOP_MOUSE_PX = 5
const HIT_SLOP_TOUCH_PX = 12

/** Half-width of the square around a tap that counts as a hit. Fingers are less precise than a mouse. */
export function hitSlopPx(touch: boolean): number {
  return touch ? HIT_SLOP_TOUCH_PX : HIT_SLOP_MOUSE_PX
}

type PointerEventLike = { type?: string; pointerType?: string }

/**
 * Whether a map click came from a finger or pen. Touch and pointer events say so directly.
 * A plain mouse-style click carries no hint, so fall back to the primary pointer being coarse.
 */
export function isTouchInput(
  event: PointerEventLike | null | undefined,
  primaryPointerIsCoarse: boolean = prefersCoarsePointer(),
): boolean {
  if (event?.pointerType) return event.pointerType !== 'mouse'
  if (event?.type?.startsWith('touch')) return true
  return primaryPointerIsCoarse
}

function prefersCoarsePointer(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(pointer: coarse)').matches
}

const GEOMETRY_RANK: Record<string, number> = {
  Point: 0,
  MultiPoint: 0,
  LineString: 1,
  MultiLineString: 1,
  Polygon: 2,
  MultiPolygon: 2,
}

/** Lower wins: points, then lines, then areas, then relation outlines. */
export function hitKindRank(feature: PickableFeature): number {
  if (feature.properties?.type === 'relation') return 3
  const geometryType = feature.geometry?.type
  const rank = geometryType == null ? undefined : GEOMETRY_RANK[geometryType]
  if (rank != null) return rank
  // No geometry (stubs, odd sources): fall back to the OSM type.
  return feature.properties?.type === 'node' ? 0 : 1
}

export function rotateOverlappingFeatures<T extends PickableFeature>(
  features: T[],
  previousId: string | number | null,
): { feature: T; nextId: string | number } | null {
  const seen = new Set<string | number>()
  const deduplicated: T[] = []
  for (const feature of features) {
    if (feature.id == null || seen.has(feature.id)) continue
    seen.add(feature.id)
    deduplicated.push(feature)
  }
  if (deduplicated.length === 0) return null

  // Stable cycle order: points, lines, areas; then by id. First tap lands on the topmost kind.
  const sorted = [...deduplicated].sort(
    (a, b) => hitKindRank(a) - hitKindRank(b) || Number(a.id) - Number(b.id),
  )
  const selectedIndex = sorted.findIndex((feature) => feature.id === previousId)
  const nextIndex = (((selectedIndex + 1) % sorted.length) + sorted.length) % sorted.length
  const feature = sorted[nextIndex]
  if (!feature || feature.id == null) return null
  return { feature, nextId: feature.id }
}

export function pickChangesetActionFromClick(options: {
  map: Map
  point: Point
  interactiveLayerIds: string[]
  actions: AdiffAction[]
  previousFeatureId: string | number | null
  isFeatureVisible?: (feature: PickableFeature) => boolean
  /** Half-width of the hit box in px. Use `hitSlopPx(isTouchInput(event))`. */
  hitSlop?: number
}): { action: AdiffAction | null; nextFeatureId: string | number | null } {
  const {
    map,
    point,
    interactiveLayerIds,
    actions,
    previousFeatureId,
    isFeatureVisible,
    hitSlop = HIT_SLOP_MOUSE_PX,
  } = options
  const layerIds = interactiveLayerIds.filter((layerId) => Boolean(map.getLayer(layerId)))
  if (layerIds.length === 0) {
    return { action: null, nextFeatureId: null }
  }

  // Justified exception for hit slop + overlap carousel: react-map-gl `event.features`
  // is point-exact and has no overlap rotation. Not used for hover.
  const rendered = map
    .queryRenderedFeatures(
      [
        [point.x - hitSlop, point.y - hitSlop],
        [point.x + hitSlop, point.y + hitSlop],
      ],
      { layers: layerIds },
    )
    .filter((feature) => isClickableMapFeature(feature))
    .filter((feature) => isFeatureVisible?.(feature) ?? true)

  const picked = rotateOverlappingFeatures(rendered, previousFeatureId)
  if (!picked) {
    return { action: null, nextFeatureId: null }
  }

  const action =
    actions.find((item) => {
      if (isNoopAction(item)) return false
      const element = item.new ?? item.old
      return (
        element?.type === picked.feature.properties?.type &&
        element?.id === picked.feature.properties?.id
      )
    }) ?? null

  return { action, nextFeatureId: picked.nextId }
}
