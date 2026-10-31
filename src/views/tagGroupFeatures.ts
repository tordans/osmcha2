type LngLat = readonly [lng: number, lat: number]
export type GeoShape = { kind: 'point'; at: LngLat } | { kind: 'line'; points: readonly LngLat[] }

export type LngLatBox = { west: number; south: number; east: number; north: number }

type FeatureLike = {
  geometry?: {
    type?: string
    coordinates?: unknown
  } | null
  properties?: {
    type?: string
    id?: number
    clickable?: boolean
  } | null
}

type IndexedShape = {
  /** `node/123` */
  key: string
  elementType: string
  /** An untagged corner of a way: drawn, but the way's own line already covers it. */
  vertex: boolean
  shape: GeoShape
  box: LngLatBox
}

export type ChangesetFeatureIndex = {
  shapes: IndexedShape[]
  byKey: Map<string, IndexedShape[]>
}

function isLngLat(value: unknown): value is LngLat {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  )
}

function lineOf(coordinates: unknown): LngLat[] {
  return Array.isArray(coordinates) ? coordinates.filter(isLngLat) : []
}

/** A feature's geometry as points and lines; the rings of an area are lines. */
function shapesOf(geometry: NonNullable<FeatureLike['geometry']>): GeoShape[] {
  const { type, coordinates } = geometry
  if (type === 'Point') return isLngLat(coordinates) ? [{ kind: 'point', at: coordinates }] : []
  if (type === 'LineString') {
    const points = lineOf(coordinates)
    return points.length >= 2 ? [{ kind: 'line', points }] : []
  }
  if (type === 'Polygon' && Array.isArray(coordinates)) {
    return coordinates.flatMap((ring) => {
      const points = lineOf(ring)
      return points.length >= 2 ? [{ kind: 'line' as const, points }] : []
    })
  }
  return []
}

function boxOf(shape: GeoShape): LngLatBox {
  const points = shape.kind === 'point' ? [shape.at] : shape.points
  let west = Infinity
  let south = Infinity
  let east = -Infinity
  let north = -Infinity
  for (const [lng, lat] of points) {
    west = Math.min(west, lng)
    east = Math.max(east, lng)
    south = Math.min(south, lat)
    north = Math.max(north, lat)
  }
  return { west, south, east, north }
}

const indexes = new WeakMap<object, ChangesetFeatureIndex>()

/** Every changeset feature as points and lines with its bounding box, built once per GeoJSON. */
export function changesetFeatureIndex(geojson: {
  features: readonly FeatureLike[]
}): ChangesetFeatureIndex {
  const cached = indexes.get(geojson)
  if (cached) return cached
  const shapes: IndexedShape[] = []
  const byKey = new Map<string, IndexedShape[]>()
  for (const feature of geojson.features) {
    const properties = feature.properties
    if (!feature.geometry || properties?.type == null || properties.id == null) continue
    const key = `${properties.type}/${properties.id}`
    for (const shape of shapesOf(feature.geometry)) {
      const indexed: IndexedShape = {
        key,
        elementType: properties.type,
        vertex: properties.type === 'node' && properties.clickable === false,
        shape,
        box: boxOf(shape),
      }
      shapes.push(indexed)
      const list = byKey.get(key)
      if (list) list.push(indexed)
      else byKey.set(key, [indexed])
    }
  }
  const index = { shapes, byKey }
  indexes.set(geojson, index)
  return index
}

/** The shapes of the given elements, old and new side alike: both are drawn and both get the halo. */
export function memberShapes(index: ChangesetFeatureIndex, memberKeys: readonly string[]) {
  return memberKeys.flatMap((key) => index.byKey.get(key) ?? [])
}

/**
 * Shapes of other elements whose box meets `box`, whether or not their map layer is switched on, so
 * a group keeps its shape. Relations are skipped: their feature is only the box around their
 * members, which are listed as features of their own.
 */
export function obstacleShapes(
  index: ChangesetFeatureIndex,
  box: LngLatBox,
  options: { exclude: ReadonlySet<string> },
) {
  return index.shapes.filter(
    (item) =>
      item.elementType !== 'relation' &&
      !item.vertex &&
      !options.exclude.has(item.key) &&
      item.box.east >= box.west &&
      item.box.west <= box.east &&
      item.box.north >= box.south &&
      item.box.south <= box.north,
  )
}

/** The box around the given elements, or `null` when none has a shape. */
export function memberBox(index: ChangesetFeatureIndex, memberKeys: readonly string[]) {
  const shapes = memberShapes(index, memberKeys)
  if (shapes.length === 0) return null
  return shapes.reduce<LngLatBox>(
    (box, item) => ({
      west: Math.min(box.west, item.box.west),
      south: Math.min(box.south, item.box.south),
      east: Math.max(box.east, item.box.east),
      north: Math.max(box.north, item.box.north),
    }),
    shapes[0]!.box,
  )
}
