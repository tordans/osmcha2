/**
 * The review area: the place a list is filtered to (`geometry` or `in_bbox`), and whether a
 * changeset's edits actually touch it.
 *
 * OSMCha's location filter only checks that the changeset's bounding box meets the area. A
 * changeset with one edit in Paris and one in Tokyo has a bbox that covers Berlin, so it shows up
 * in a Berlin list. Once the edits' geometry is known, these helpers tell such changesets apart.
 *
 * Planar lon/lat math, like the server. Good enough at the scale of a review area.
 */
import type { AdiffAction, AdiffElement } from './changesetElements.ts'
import { isNoopAction } from './changesetElements.ts'

type Point = [lon: number, lat: number]
type Ring = Point[]
/** Outer ring first, then holes. */
type PolygonRings = Ring[]
type Bbox = [west: number, south: number, east: number, north: number]

export type ReviewArea = {
  /** Same text for the same shape: keys stored results. */
  key: string
  polygons: PolygonRings[]
  bbox: Bbox
  /** `in_bbox` is a box; `geometry` is a drawn polygon or a searched place. */
  kind: 'box' | 'shape'
}

/** `inside`: an edit meets the area. `outside`: none does. */
export type ReviewAreaOverlap = 'inside' | 'outside'

// ---------------------------------------------------------------------------
// Reading the area from filters

/** Filter values arrive as `[{ label, value }]` from the URL and as raw values from a saved filter. */
function filterValues(raw: unknown): unknown[] {
  const items = Array.isArray(raw) ? raw : [raw]
  return items
    .map((item) =>
      item && typeof item === 'object' && 'value' in item
        ? (item as { value: unknown }).value
        : item,
    )
    .filter((value) => value != null && value !== '')
}

function toPoint(position: unknown): Point | null {
  if (!Array.isArray(position)) return null
  const [lon, lat] = position
  if (typeof lon !== 'number' || typeof lat !== 'number') return null
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null
  return [lon, lat]
}

function toRing(ring: unknown): Ring | null {
  if (!Array.isArray(ring)) return null
  const points = ring.map(toPoint)
  if (points.some((point) => point == null) || points.length < 4) return null
  return points as Ring
}

function toPolygon(rings: unknown): PolygonRings | null {
  if (!Array.isArray(rings) || rings.length === 0) return null
  const parsed = rings.map(toRing)
  if (parsed[0] == null) return null
  return parsed.filter((ring): ring is Ring => ring != null)
}

function polygonsOfGeometry(value: unknown): PolygonRings[] | null {
  let geometry = value
  if (typeof geometry === 'string') {
    try {
      geometry = JSON.parse(geometry)
    } catch {
      return null
    }
  }
  if (!geometry || typeof geometry !== 'object') return null
  const { type, coordinates } = geometry as { type?: unknown; coordinates?: unknown }
  if (type === 'Feature') return polygonsOfGeometry((geometry as { geometry?: unknown }).geometry)
  if (type === 'Polygon') {
    const polygon = toPolygon(coordinates)
    return polygon ? [polygon] : null
  }
  if (type === 'MultiPolygon' && Array.isArray(coordinates)) {
    const polygons = coordinates
      .map(toPolygon)
      .filter((polygon): polygon is PolygonRings => polygon != null)
    return polygons.length > 0 ? polygons : null
  }
  return null
}

function boxPolygon([west, south, east, north]: Bbox): PolygonRings {
  return [
    [
      [west, south],
      [east, south],
      [east, north],
      [west, north],
      [west, south],
    ],
  ]
}

function parseBbox(raw: unknown): Bbox | null {
  const numbers = filterValues(raw)
    .flatMap((value) => String(value).split(','))
    .map((part) => Number(part.trim()))
  if (numbers.length !== 4 || numbers.some((n) => !Number.isFinite(n))) return null
  const [west, south, east, north] = numbers as Bbox
  if (!(east > west) || !(north > south)) return null
  return [west, south, east, north]
}

function boundsOfPolygons(polygons: readonly PolygonRings[]): Bbox {
  const bbox: Bbox = [Infinity, Infinity, -Infinity, -Infinity]
  for (const polygon of polygons) {
    for (const [lon, lat] of polygon[0] ?? []) {
      bbox[0] = Math.min(bbox[0], lon)
      bbox[1] = Math.min(bbox[1], lat)
      bbox[2] = Math.max(bbox[2], lon)
      bbox[3] = Math.max(bbox[3], lat)
    }
  }
  return bbox
}

/** Short, stable text for a shape, so stored results stay with the area they were made for. */
function shapeKey(polygons: readonly PolygonRings[]) {
  const text = JSON.stringify(polygons)
  let hash = 5381
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0
  return `${(hash >>> 0).toString(36)}-${text.length.toString(36)}`
}

/**
 * The review area of a list, from its filters (`geometry` wins over `in_bbox`, as on the server).
 * Takes URL filters (`[{ label, value }]`) and saved-filter values alike. Null without one.
 */
export function reviewAreaFromFilters(
  filters: Record<string, unknown> | null | undefined,
): ReviewArea | null {
  if (!filters) return null
  const geometry = filterValues(filters.geometry)[0]
  const polygons = geometry != null ? polygonsOfGeometry(geometry) : null
  if (polygons) {
    return { key: shapeKey(polygons), polygons, bbox: boundsOfPolygons(polygons), kind: 'shape' }
  }
  const bbox = parseBbox(filters.in_bbox)
  if (!bbox) return null
  const box = boxPolygon(bbox)
  return { key: shapeKey([box]), polygons: [box], bbox, kind: 'box' }
}

// ---------------------------------------------------------------------------
// Geometry tests

function bboxesMeet(a: Bbox, b: Bbox) {
  return a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3]
}

function pointInBbox([lon, lat]: Point, bbox: Bbox) {
  return lon >= bbox[0] && lon <= bbox[2] && lat >= bbox[1] && lat <= bbox[3]
}

/** Even-odd ray cast. A point on the edge may land either way; edges are caught by crossings. */
function pointInRing([x, y]: Point, ring: Ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!
    const [xj, yj] = ring[j]!
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function pointInPolygon(point: Point, [outer, ...holes]: PolygonRings) {
  if (!outer || !pointInRing(point, outer)) return false
  return !holes.some((hole) => pointInRing(point, hole))
}

function pointInArea(point: Point, area: ReviewArea) {
  if (!pointInBbox(point, area.bbox)) return false
  return area.polygons.some((polygon) => pointInPolygon(point, polygon))
}

function orientation(a: Point, b: Point, c: Point) {
  const value = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
  return value > 0 ? 1 : value < 0 ? -1 : 0
}

function onSegment(a: Point, b: Point, c: Point) {
  return (
    Math.min(a[0], b[0]) <= c[0] &&
    c[0] <= Math.max(a[0], b[0]) &&
    Math.min(a[1], b[1]) <= c[1] &&
    c[1] <= Math.max(a[1], b[1])
  )
}

function segmentsCross(p1: Point, p2: Point, q1: Point, q2: Point) {
  const o1 = orientation(p1, p2, q1)
  const o2 = orientation(p1, p2, q2)
  const o3 = orientation(q1, q2, p1)
  const o4 = orientation(q1, q2, p2)
  if (o1 !== o2 && o3 !== o4) return true
  if (o1 === 0 && onSegment(p1, p2, q1)) return true
  if (o2 === 0 && onSegment(p1, p2, q2)) return true
  if (o3 === 0 && onSegment(q1, q2, p1)) return true
  if (o4 === 0 && onSegment(q1, q2, p2)) return true
  return false
}

function segmentCrossesArea(a: Point, b: Point, area: ReviewArea) {
  const segmentBbox: Bbox = [
    Math.min(a[0], b[0]),
    Math.min(a[1], b[1]),
    Math.max(a[0], b[0]),
    Math.max(a[1], b[1]),
  ]
  if (!bboxesMeet(segmentBbox, area.bbox)) return false
  for (const polygon of area.polygons) {
    for (const ring of polygon) {
      for (let i = 0; i < ring.length - 1; i++) {
        if (segmentsCross(a, b, ring[i]!, ring[i + 1]!)) return true
      }
    }
  }
  return false
}

/** A point, a line, or a closed line (which may also hold the whole area inside). */
type EditShape = Point[]

function lineMeetsArea(line: EditShape, area: ReviewArea) {
  if (line.length === 0) return false
  const lineBbox: Bbox = [Infinity, Infinity, -Infinity, -Infinity]
  for (const [lon, lat] of line) {
    lineBbox[0] = Math.min(lineBbox[0], lon)
    lineBbox[1] = Math.min(lineBbox[1], lat)
    lineBbox[2] = Math.max(lineBbox[2], lon)
    lineBbox[3] = Math.max(lineBbox[3], lat)
  }
  if (!bboxesMeet(lineBbox, area.bbox)) return false
  if (line.some((point) => pointInArea(point, area))) return true
  for (let i = 0; i < line.length - 1; i++) {
    if (segmentCrossesArea(line[i]!, line[i + 1]!, area)) return true
  }
  // A closed way around the whole area: a big landuse or boundary that was edited.
  const first = line[0]!
  const last = line[line.length - 1]!
  if (line.length >= 4 && first[0] === last[0] && first[1] === last[1]) {
    const probe = area.polygons[0]?.[0]?.[0]
    if (probe && pointInRing(probe, line)) return true
  }
  return false
}

// ---------------------------------------------------------------------------
// Changeset edits

function lonLatPoint(item: { lon?: unknown; lat?: unknown } | null | undefined): Point | null {
  if (!item) return null
  const lon = Number(item.lon)
  const lat = Number(item.lat)
  if (item.lon == null || item.lat == null || !Number.isFinite(lon) || !Number.isFinite(lat)) {
    return null
  }
  return [lon, lat]
}

function lineOfNodes(nodes: readonly unknown[] | undefined): EditShape {
  const line: EditShape = []
  for (const node of nodes ?? []) {
    if (!node || typeof node !== 'object') continue
    const point = lonLatPoint(node as { lon?: unknown; lat?: unknown })
    if (point) line.push(point)
  }
  return line
}

function shapesOfElement(element: AdiffElement | undefined): EditShape[] {
  if (!element) return []
  if (element.type === 'node') {
    const point = lonLatPoint(element)
    return point ? [[point]] : []
  }
  if (element.type === 'way') return [lineOfNodes(element.nodes)]
  if (element.type === 'relation') {
    return (element.members ?? []).flatMap((member) => {
      if (member?.type === 'node') {
        const point = lonLatPoint(member)
        return point ? [[point]] : []
      }
      if (member?.type === 'way') return [lineOfNodes(member.nodes)]
      return []
    })
  }
  return []
}

/**
 * Whether any edit in the changeset meets the area: created, modified and deleted elements,
 * old and new side. Unchanged context is left out. Relations count by their members.
 * Null when the diff holds no geometry to decide on.
 */
export function adiffOverlap(
  actions: readonly AdiffAction[],
  area: ReviewArea,
): ReviewAreaOverlap | null {
  let sawGeometry = false
  for (const action of actions) {
    if (isNoopAction(action)) continue
    for (const element of [action.old, action.new]) {
      for (const shape of shapesOfElement(element)) {
        if (shape.length === 0) continue
        sawGeometry = true
        if (lineMeetsArea(shape, area)) return 'inside'
      }
    }
  }
  return sawGeometry ? 'outside' : null
}

/**
 * What the changeset's bbox alone tells: `inside` when it lies wholly within the area, so every
 * edit does too. Null when only the edits can tell.
 */
export function changesetBboxOverlap(
  geometry: unknown,
  area: ReviewArea,
): ReviewAreaOverlap | null {
  const polygons = polygonsOfGeometry(geometry)
  const box = polygons ? boundsOfPolygons(polygons) : null
  if (!box || !Number.isFinite(box[0])) return null
  if (!bboxesMeet(box, area.bbox)) return 'outside'
  const ring = boxPolygon(box)[0]!
  // Degenerate bbox of a single node: just the point.
  if (box[0] === box[2] && box[1] === box[3]) {
    return pointInArea([box[0], box[1]], area) ? 'inside' : 'outside'
  }
  if (!pointInArea(ring[0]!, area)) return null
  for (let i = 0; i < ring.length - 1; i++) {
    if (segmentCrossesArea(ring[i]!, ring[i + 1]!, area)) return null
  }
  return 'inside'
}
