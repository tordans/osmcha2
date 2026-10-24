import { objectRefKey } from '../../notes/locateNotes.ts'
import { distanceMeters, longitudeScale, METERS_PER_DEGREE } from './changeGroupClusters.ts'
import type { AdiffAction, ElementChange, LonLat } from './changesetElements.ts'

/** A node moved this far or less (and nothing else changed) needs no review. */
export const MINOR_NODE_MOVE_METERS = 2
/** A line or area whose shape shifted this far or less (and nothing else changed) needs no review. */
export const MINOR_WAY_MOVE_METERS = 2

/** Shown under the "Minor moves" heading. Both limits are 2 m today. */
export const MINOR_MOVES_EXPLANATION = `Moved less than ${MINOR_NODE_MOVE_METERS} m; marked as seen automatically.`

type Point = { x: number; y: number }

function lonLatOf(node: { lon?: number; lat?: number } | number | undefined): LonLat | undefined {
  if (node == null || typeof node === 'number') return undefined
  if (node.lon == null || node.lat == null) return undefined
  return Number.isFinite(node.lon) && Number.isFinite(node.lat)
    ? { lon: node.lon, lat: node.lat }
    : undefined
}

/** Node coordinates in way order, or undefined when any node has no coordinates. */
function wayVertices(element: AdiffAction['old']): LonLat[] | undefined {
  const nodes = element?.nodes
  if (!nodes || nodes.length === 0) return undefined
  const vertices: LonLat[] = []
  for (const node of nodes) {
    const at = lonLatOf(node)
    if (!at) return undefined
    vertices.push(at)
  }
  return vertices
}

function distanceToSegment(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y)
  const t = Math.max(
    0,
    Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared),
  )
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy))
}

/** Largest distance from a vertex of `from` to the nearest segment of `to`. */
function farthestVertexMeters(from: Point[], to: Point[]): number {
  let farthest = 0
  for (const point of from) {
    let nearest = Number.POSITIVE_INFINITY
    for (let index = 0; index < to.length - 1; index++) {
      const start = to[index]
      const end = to[index + 1]
      if (!start || !end) continue
      nearest = Math.min(nearest, distanceToSegment(point, start, end))
    }
    farthest = Math.max(farthest, nearest)
  }
  return farthest
}

/**
 * Discrete Hausdorff distance, in meters, between two shapes given as vertex lists: the larger of
 * "how far is the farthest vertex of A from the line B" and the same the other way round. A strict
 * maximum, so one vertex moved far is never hidden by many that barely moved. Undefined for fewer
 * than two vertices per shape, where there is no line to measure against.
 */
export function hausdorffMeters(before: LonLat[], after: LonLat[]): number | undefined {
  if (before.length < 2 || after.length < 2) return undefined
  const all = [...before, ...after]
  const latitude = all.reduce((sum, at) => sum + at.lat, 0) / all.length
  const longitude = all.reduce((sum, at) => sum + at.lon, 0) / all.length
  const scale = longitudeScale(latitude)
  // Equirectangular projection around the shape: accurate enough for a few meters.
  const project = (at: LonLat): Point => ({
    x: (at.lon - longitude) * METERS_PER_DEGREE * scale,
    y: (at.lat - latitude) * METERS_PER_DEGREE,
  })
  const projectedBefore = before.map(project)
  const projectedAfter = after.map(project)
  return Math.max(
    farthestVertexMeters(projectedBefore, projectedAfter),
    farthestVertexMeters(projectedAfter, projectedBefore),
  )
}

/**
 * How far a modified node, line or area was moved, when that is a minor move: only the position
 * changed (`geometry` is 'moved', no tag changed) and it moved no more than the limit. Undefined
 * otherwise, also when coordinates are missing. `geometry` and `tagsChanged` come from the caller,
 * which already classified the action.
 */
export function minorMoveOf(
  action: AdiffAction,
  { geometry, tagsChanged }: { geometry: ElementChange['geometry']; tagsChanged: boolean },
): ElementChange['minorMove'] {
  if (action.type !== 'modify' || geometry !== 'moved' || tagsChanged) return undefined

  if (action.new?.type === 'node') {
    const before = lonLatOf(action.old)
    const after = lonLatOf(action.new)
    if (!before || !after) return undefined
    const meters = distanceMeters(before, after)
    return meters <= MINOR_NODE_MOVE_METERS ? { meters } : undefined
  }

  if (action.new?.type === 'way') {
    const before = wayVertices(action.old)
    const after = wayVertices(action.new)
    if (!before || !after) return undefined
    const meters = hausdorffMeters(before, after)
    return meters != null && meters <= MINOR_WAY_MOVE_METERS ? { meters } : undefined
  }

  return undefined
}

/** `node/1`-style keys of the changes that count as seen without the reviewer looking. */
export function minorMoveObjectKeys(changes: ElementChange[]): string[] {
  return changes
    .filter((change) => change.minorMove != null)
    .map((change) => objectRefKey(change.type, change.id))
}

export function formatMoveMeters(meters: number): string {
  return `${meters.toFixed(1)} m`
}
