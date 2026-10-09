import {
  changedEditFeatures,
  elementKey,
  featureBounds,
  padDegenerateBounds,
  withoutRelationEnvelopes,
  type ChangesetViewFeature,
  type LngLatBoundsTuple,
} from './changesetViewBounds.ts'

export type WorkArea = {
  /** 1-based and stable for one changeset payload; shown as "Area 1". */
  id: number
  bounds: LngLatBoundsTuple
  /** `type/id` of every edited element inside. */
  elementKeys: ReadonlySet<string>
}

/** Which work areas the current viewport shows. */
export type ActiveWorkArea = 'all' | number | null

/** Mercator world units, x east and y south, both 0..1. */
type Box = [minX: number, minY: number, maxX: number, maxY: number]

const TILE_SIZE = 512
const MAX_MERCATOR_LAT = 85.051129
/** A changeset that fits a view of this size at this zoom is readable as one area. */
const SINGLE_VIEW_ZOOM = 13
const SINGLE_VIEW_PX = 600
const SINGLE_VIEW_EXTENT = SINGLE_VIEW_PX / (TILE_SIZE * 2 ** SINGLE_VIEW_ZOOM)
/** Edits closer than this never split, however far the changeset spans. */
const MIN_GAP = SINGLE_VIEW_EXTENT / 4
/** Edits split when the gap between them is this share of the whole extent. */
const GAP_FRACTION = 0.1
/** More areas than this are merged by widening the gap. */
const MAX_AREAS = 8
/** Outline: space around the edits, and the smallest box that stays visible zoomed out. */
const OUTLINE_PADDING_PX = 28
const OUTLINE_MIN_SIZE_PX = 56

function mercatorX(lng: number) {
  return (lng + 180) / 360
}

function mercatorY(lat: number) {
  const clamped = Math.max(-MAX_MERCATOR_LAT, Math.min(MAX_MERCATOR_LAT, lat))
  const sin = Math.sin((clamped * Math.PI) / 180)
  return 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)
}

function lngFromMercatorX(x: number) {
  return x * 360 - 180
}

function latFromMercatorY(y: number) {
  return (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI
}

function boxOfBounds([west, south, east, north]: LngLatBoundsTuple): Box {
  return [mercatorX(west), mercatorY(north), mercatorX(east), mercatorY(south)]
}

function boundsOfBox([minX, minY, maxX, maxY]: Box): LngLatBoundsTuple {
  return [
    lngFromMercatorX(minX),
    latFromMercatorY(maxY),
    lngFromMercatorX(maxX),
    latFromMercatorY(minY),
  ]
}

function unionBounds(a: LngLatBoundsTuple, b: LngLatBoundsTuple): LngLatBoundsTuple {
  return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]
}

function boundsIntersect(a: LngLatBoundsTuple, b: LngLatBoundsTuple) {
  return a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3]
}

type ElementBounds = { key: string; bounds: LngLatBoundsTuple }

/** One box per element: a modify has an old and a new side. */
function elementBounds(
  features: ReadonlyArray<ChangesetViewFeature & { geometry: GeoJSON.Geometry }>,
) {
  const byKey = new Map<string, LngLatBoundsTuple>()
  features.forEach((feature, index) => {
    const bounds = featureBounds([feature])
    if (!bounds) return
    const key = elementKey(feature) ?? `#${index}`
    const known = byKey.get(key)
    byKey.set(key, known ? unionBounds(known, bounds) : bounds)
  })
  const elements: ElementBounds[] = [...byKey].map(([key, bounds]) => ({ key, bounds }))
  return elements
}

/** Single linkage: elements whose boxes are within `gap` of each other share a cluster. */
function clusterBoxes(boxes: readonly Box[], gap: number) {
  const parent = boxes.map((_, index) => index)
  function find(index: number) {
    let root = index
    while (parent[root] !== root) root = parent[root]!
    while (parent[index] !== root) {
      const next = parent[index]!
      parent[index] = root
      index = next
    }
    return root
  }

  const order = boxes.map((_, index) => index).sort((a, b) => boxes[a]![0] - boxes[b]![0])
  for (let i = 0; i < order.length; i++) {
    const a = boxes[order[i]!]!
    for (let j = i + 1; j < order.length; j++) {
      const b = boxes[order[j]!]!
      if (b[0] > a[2] + gap) break
      if (b[1] <= a[3] + gap && a[1] <= b[3] + gap) parent[find(order[j]!)] = find(order[i]!)
    }
  }

  const clusters = new Map<number, number[]>()
  boxes.forEach((_, index) => {
    const root = find(index)
    const members = clusters.get(root)
    if (members) members.push(index)
    else clusters.set(root, [index])
  })
  return [...clusters.values()]
}

/**
 * Split a changeset's edits into the places where the work happened. A changeset
 * that reads well in one view stays one area; far-apart edits each get their own.
 */
export function changesetWorkAreas(features: readonly ChangesetViewFeature[]) {
  const changed = changedEditFeatures(features)
  const elements = elementBounds(withoutRelationEnvelopes(changed))
  if (elements.length === 0) return []

  const boxes = elements.map((element) => boxOfBounds(element.bounds))
  const extent = Math.max(
    Math.max(...boxes.map((box) => box[2])) - Math.min(...boxes.map((box) => box[0])),
    Math.max(...boxes.map((box) => box[3])) - Math.min(...boxes.map((box) => box[1])),
  )

  let clusters = [boxes.map((_, index) => index)]
  if (extent > SINGLE_VIEW_EXTENT) {
    let gap = Math.max(MIN_GAP, extent * GAP_FRACTION)
    clusters = clusterBoxes(boxes, gap)
    while (clusters.length > MAX_AREAS) {
      gap *= 1.5
      clusters = clusterBoxes(boxes, gap)
    }
  }

  const areas = clusters
    .map((members) => ({
      bounds: members.map((index) => elements[index]!.bounds).reduce(unionBounds),
      elementKeys: new Set(members.map((index) => elements[index]!.key)),
    }))
    .sort((a, b) => b.elementKeys.size - a.elementKeys.size || a.bounds[0] - b.bounds[0])

  // Relations kept out of the clustering still belong to the area they touch.
  for (const element of elementBounds(changed)) {
    if (areas.some((area) => area.elementKeys.has(element.key))) continue
    areas.find((area) => boundsIntersect(area.bounds, element.bounds))?.elementKeys.add(element.key)
  }

  return areas.map((area, index) => {
    const workArea: WorkArea = {
      id: index + 1,
      bounds: padDegenerateBounds(area.bounds),
      elementKeys: area.elementKeys,
    }
    return workArea
  })
}

/** The single area in view, `'all'` when every area is in view, else `null`. */
export function activeWorkArea(areas: readonly WorkArea[], view: LngLatBoundsTuple) {
  const visible = areas.filter((area) => boundsIntersect(area.bounds, view))
  const active: ActiveWorkArea =
    visible.length === areas.length ? 'all' : visible.length === 1 ? visible[0]!.id : null
  return active
}

/**
 * Outline boxes around each area. Padding and minimum size are in screen pixels,
 * so a small area far away still shows as a box when zoomed out.
 */
export function workAreaOutlines(areas: readonly WorkArea[], zoom: number) {
  const unitsPerPx = 1 / (TILE_SIZE * 2 ** zoom)
  const features: GeoJSON.Feature<GeoJSON.Polygon>[] = areas.map((area) => {
    const [minX, minY, maxX, maxY] = boxOfBounds(area.bounds)
    const halfWidth = Math.max(
      (maxX - minX) / 2 + OUTLINE_PADDING_PX * unitsPerPx,
      (OUTLINE_MIN_SIZE_PX / 2) * unitsPerPx,
    )
    const halfHeight = Math.max(
      (maxY - minY) / 2 + OUTLINE_PADDING_PX * unitsPerPx,
      (OUTLINE_MIN_SIZE_PX / 2) * unitsPerPx,
    )
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    const [west, south, east, north] = boundsOfBox([
      centerX - halfWidth,
      Math.max(0, centerY - halfHeight),
      centerX + halfWidth,
      Math.min(1, centerY + halfHeight),
    ])
    return {
      type: 'Feature',
      properties: { id: area.id },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [west, north],
            [east, north],
            [east, south],
            [west, south],
            [west, north],
          ],
        ],
      },
    }
  })
  const collection: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
    type: 'FeatureCollection',
    features,
  }
  return collection
}
