import {
  changedEditFeatures,
  elementKey,
  geometryBounds,
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
    const bounds = geometryBounds(feature.geometry)
    if (!bounds) return
    const key = elementKey(feature) ?? `#${index}`
    const known = byKey.get(key)
    byKey.set(key, known ? unionBounds(known, bounds) : bounds)
  })
  const elements: ElementBounds[] = [...byKey].map(([key, bounds]) => ({ key, bounds }))
  return elements
}

/** True when the boxes are at most `gap` apart on both axes. */
function boxesWithin(a: Box, b: Box, gap: number) {
  return a[0] <= b[2] + gap && b[0] <= a[2] + gap && a[1] <= b[3] + gap && b[1] <= a[3] + gap
}

/**
 * Single linkage: elements whose boxes are within `gap` of each other share a cluster.
 *
 * Boxes go into a grid of `gap / 3` cells. Boxes in the same or touching cells are
 * always within `gap`, so they join without a check; only cells two to four apart
 * compare boxes. A busy changeset is then near-linear instead of comparing every pair.
 */
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
  function join(a: number, b: number) {
    parent[find(a)] = find(b)
  }

  const size = gap / 3
  let originX = Infinity
  let originY = Infinity
  let maxY = -Infinity
  for (const box of boxes) {
    originX = Math.min(originX, box[0])
    originY = Math.min(originY, box[1])
    maxY = Math.max(maxY, box[3])
  }
  const column = (x: number) => Math.floor((x - originX) / size)
  const row = (y: number) => Math.floor((y - originY) / size)
  // `gap` is at least a tenth of the extent, so the grid stays around 30×30 cells.
  const rows = row(maxY) + 1
  const cells = new Map<number, { column: number; row: number; members: number[] }>()
  boxes.forEach((box, index) => {
    for (let x = column(box[0]); x <= column(box[2]); x++) {
      for (let y = row(box[1]); y <= row(box[3]); y++) {
        const key = x * rows + y
        const cell = cells.get(key)
        if (cell) {
          cell.members.push(index)
          join(index, cell.members[0]!)
        } else {
          cells.set(key, { column: x, row: y, members: [index] })
        }
      }
    }
  })

  function cellBox(cell: { column: number; row: number }): Box {
    const minX = originX + cell.column * size
    const minY = originY + cell.row * size
    return [minX, minY, minX + size, minY + size]
  }

  function joinIfAnyWithin(a: number[], b: number[], aBox: Box, bBox: Box) {
    // Only boxes near the other cell can be within `gap`; the slack covers rounding.
    const nearB = a.filter((index) => boxesWithin(boxes[index]!, bBox, gap + size))
    const nearA = b.filter((index) => boxesWithin(boxes[index]!, aBox, gap + size))
    for (const i of nearB) {
      for (const j of nearA) {
        if (boxesWithin(boxes[i]!, boxes[j]!, gap)) {
          join(i, j)
          return
        }
      }
    }
  }

  const MAX_CELL_DISTANCE = 4
  for (const pass of ['touching', 'apart'] as const) {
    for (const cell of cells.values()) {
      for (let dx = 0; dx <= MAX_CELL_DISTANCE; dx++) {
        for (let dy = -MAX_CELL_DISTANCE; dy <= MAX_CELL_DISTANCE; dy++) {
          // Each pair of cells once.
          if (dx === 0 && dy <= 0) continue
          const touching = dx <= 1 && Math.abs(dy) <= 1
          if (touching !== (pass === 'touching')) continue
          const other = cells.get((cell.column + dx) * rows + cell.row + dy)
          if (!other || other.row !== cell.row + dy) continue
          const a = cell.members[0]!
          const b = other.members[0]!
          if (find(a) === find(b)) continue
          if (touching) join(a, b)
          else joinIfAnyWithin(cell.members, other.members, cellBox(cell), cellBox(other))
        }
      }
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
  const clustered = withoutRelationEnvelopes(changed)
  const elements = elementBounds(clustered)
  if (elements.length === 0) return []

  const boxes = elements.map((element) => boxOfBounds(element.bounds))
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const box of boxes) {
    minX = Math.min(minX, box[0])
    minY = Math.min(minY, box[1])
    maxX = Math.max(maxX, box[2])
    maxY = Math.max(maxY, box[3])
  }
  const extent = Math.max(maxX - minX, maxY - minY)

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
  // Without relation envelopes removed, the element list is the same one, so reuse it.
  const allElements = clustered.length === changed.length ? elements : elementBounds(changed)
  for (const element of allElements) {
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
