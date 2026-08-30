import bbox from '@turf/bbox'

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

function versionOnSide(group: readonly ChangesetViewFeature[], side: string): number | undefined {
  return group.find((feature) => feature.properties?.side === side)?.properties?.version
}

function elementKey(feature: ChangesetViewFeature): string | null {
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

/** Fit the review map to local node/way edits; skip relation envelopes unless they are the only change. */
export function changesetViewBounds(
  features: readonly ChangesetViewFeature[],
): LngLatBoundsTuple | null {
  const unchanged = unchangedElementKeys(features)
  const withGeometry = features.filter(
    (feature): feature is ChangesetViewFeature & { geometry: GeoJSON.Geometry } =>
      Boolean(feature.geometry),
  )
  const changed = withGeometry.filter((feature) => isChangedEdit(feature, unchanged))
  const withoutRelations = changed.filter((feature) => feature.properties?.type !== 'relation')
  const selected = withoutRelations.length > 0 ? withoutRelations : changed
  if (selected.length === 0) return null

  const raw = bbox({
    type: 'FeatureCollection',
    features: selected.map((feature) => ({
      type: 'Feature' as const,
      geometry: feature.geometry,
      properties: feature.properties ?? {},
    })),
  })
  const west = raw[0]
  const south = raw[1]
  const east = raw.length === 6 ? raw[3] : raw[2]
  const north = raw.length === 6 ? raw[4] : raw[3]
  if (![west, south, east, north].every(Number.isFinite)) return null

  if (west === east || south === north) {
    const cosLat = Math.cos((south * Math.PI) / 180)
    return [
      west - EPSILON_DEG,
      south - EPSILON_DEG * cosLat,
      east + EPSILON_DEG,
      north + EPSILON_DEG * cosLat,
    ]
  }

  return [west, south, east, north]
}
