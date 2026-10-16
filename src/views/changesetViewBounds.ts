const EPSILON_DEG = 0.00005
const CHANGED_ACTIONS = new Set(['create', 'modify', 'delete'])

export type ChangesetViewFeature = {
  geometry?: GeoJSON.Geometry | null
  properties?: {
    action?: string
    type?: string
    id?: number
    side?: string
    version?: number
  } | null
}

export type LngLatBoundsTuple = [number, number, number, number]

type GeometryFeature = ChangesetViewFeature & { geometry: GeoJSON.Geometry }

/** West, south, east, north of the positions seen so far. */
type Extent = [west: number, south: number, east: number, north: number]

function versionOnSide(group: readonly ChangesetViewFeature[], side: string): number | undefined {
  return group.find((feature) => feature.properties?.side === side)?.properties?.version
}

function emptyExtent(): Extent {
  return [Infinity, Infinity, -Infinity, -Infinity]
}

/** Same comparisons as `@turf/bbox`, so a NaN coordinate is skipped on its own axis. */
function extendWithPosition(extent: Extent, position: GeoJSON.Position) {
  const x = position[0]!
  const y = position[1]!
  if (extent[0] > x) extent[0] = x
  if (extent[1] > y) extent[1] = y
  if (extent[2] < x) extent[2] = x
  if (extent[3] < y) extent[3] = y
}

/** Walks every position of a geometry in one pass, the way `@turf/bbox` does, without per-position closures. */
function extendWithGeometry(extent: Extent, geometry: GeoJSON.Geometry) {
  switch (geometry.type) {
    case 'Point':
      extendWithPosition(extent, geometry.coordinates)
      return
    case 'MultiPoint':
    case 'LineString':
      for (const position of geometry.coordinates) extendWithPosition(extent, position)
      return
    case 'MultiLineString':
    case 'Polygon':
      for (const line of geometry.coordinates) {
        for (const position of line) extendWithPosition(extent, position)
      }
      return
    case 'MultiPolygon':
      for (const polygon of geometry.coordinates) {
        for (const ring of polygon) {
          for (const position of ring) extendWithPosition(extent, position)
        }
      }
      return
    case 'GeometryCollection':
      for (const child of geometry.geometries) {
        if (child) extendWithGeometry(extent, child)
      }
      return
    default:
      throw new Error('Unknown Geometry Type')
  }
}

function finiteBounds(extent: Extent): LngLatBoundsTuple | null {
  const [west, south, east, north] = extent
  if (!Number.isFinite(west) || !Number.isFinite(south)) return null
  if (!Number.isFinite(east) || !Number.isFinite(north)) return null
  return [west, south, east, north]
}

export function elementKey(feature: ChangesetViewFeature): string | null {
  const type = feature.properties?.type
  const id = feature.properties?.id
  if (type == null || id == null) return null
  return `${type}/${id}`
}

/** Context members and same-version modifies are not edits; they must not widen the fit. */
function unchangedElementKeys(features: readonly ChangesetViewFeature[]): Set<string> {
  const byKey = new Map<string, ChangesetViewFeature[]>()
  for (const feature of features) {
    const key = elementKey(feature)
    if (!key) continue
    const group = byKey.get(key)
    if (group) group.push(feature)
    else byKey.set(key, [feature])
  }

  const unchanged = new Set<string>()
  for (const [key, group] of byKey) {
    if (group.every((feature) => feature.properties?.action === 'noop')) {
      unchanged.add(key)
      continue
    }
    const oldVersion = versionOnSide(group, 'old')
    const newVersion = versionOnSide(group, 'new')
    if (oldVersion != null && oldVersion === newVersion) unchanged.add(key)
  }
  return unchanged
}

function isChangedEdit(feature: ChangesetViewFeature, unchanged: ReadonlySet<string>): boolean {
  const action = feature.properties?.action
  if (!action || !CHANGED_ACTIONS.has(action)) return false
  const key = elementKey(feature)
  return !key || !unchanged.has(key)
}

function hasGeometry(feature: ChangesetViewFeature): feature is GeometryFeature {
  return Boolean(feature.geometry)
}

/** Edited features that have geometry; context members and same-version modifies are dropped. */
export function changedEditFeatures(features: readonly ChangesetViewFeature[]) {
  const unchanged = unchangedElementKeys(features)
  const changed: GeometryFeature[] = []
  for (const feature of features) {
    if (hasGeometry(feature) && isChangedEdit(feature, unchanged)) changed.push(feature)
  }
  return changed
}

/** Relation envelopes can span continents; keep them only when they are the only change. */
export function withoutRelationEnvelopes<T extends ChangesetViewFeature>(changed: readonly T[]) {
  const withoutRelations = changed.filter((feature) => feature.properties?.type !== 'relation')
  return withoutRelations.length > 0 ? withoutRelations : [...changed]
}

/** Bounds of one geometry, or null when none of its positions is finite. */
export function geometryBounds(geometry: GeoJSON.Geometry): LngLatBoundsTuple | null {
  const extent = emptyExtent()
  extendWithGeometry(extent, geometry)
  return finiteBounds(extent)
}

export function featureBounds(features: ReadonlyArray<GeometryFeature>): LngLatBoundsTuple | null {
  const extent = emptyExtent()
  for (const feature of features) extendWithGeometry(extent, feature.geometry)
  return finiteBounds(extent)
}

/** A single point has no extent to fit; widen it to a small square. */
export function padDegenerateBounds(bounds: LngLatBoundsTuple): LngLatBoundsTuple {
  const [west, south, east, north] = bounds
  if (west !== east && south !== north) return bounds
  const cosLat = Math.cos((south * Math.PI) / 180)
  return [
    west - EPSILON_DEG,
    south - EPSILON_DEG * cosLat,
    east + EPSILON_DEG,
    north + EPSILON_DEG * cosLat,
  ]
}

/** Fit the review map to local node/way edits; skip relation envelopes unless they are the only change. */
export function changesetViewBounds(
  features: readonly ChangesetViewFeature[],
): LngLatBoundsTuple | null {
  const bounds = featureBounds(withoutRelationEnvelopes(changedEditFeatures(features)))
  return bounds ? padDegenerateBounds(bounds) : null
}
