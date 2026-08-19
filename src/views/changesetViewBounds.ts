import bbox from '@turf/bbox'

const EPSILON_DEG = 0.00005

export type ChangesetViewFeature = {
  geometry?: GeoJSON.Geometry | null
  properties?: {
    action?: string
    type?: string
  } | null
}

export type LngLatBoundsTuple = [number, number, number, number]

/** Fit the review map to local node/way edits; skip relation envelopes unless they are the only change. */
export function changesetViewBounds(
  features: readonly ChangesetViewFeature[],
): LngLatBoundsTuple | null {
  const withGeometry = features.filter(
    (feature): feature is ChangesetViewFeature & { geometry: GeoJSON.Geometry } =>
      Boolean(feature.geometry),
  )
  const changed = withGeometry.filter((feature) => feature.properties?.action !== 'noop')
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
