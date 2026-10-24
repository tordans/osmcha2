import type { ElementChange, LonLat, WayShape } from './changesetElements.ts'

/** Open ways are linked when an endpoint of one lies this close to an endpoint of the other. */
export const LINE_LINK_METERS = 15
/** Nodes are linked when they are this close. */
export const POINT_LINK_METERS = 50
/** Areas are linked when their bounding boxes are this close (0 when they overlap). */
export const AREA_LINK_METERS = 25

/** Mean earth radius, in meters per degree of latitude. */
const METERS_PER_DEGREE = (Math.PI / 180) * 6_371_008.8
/** Keeps longitude scaling finite next to the poles. */
const MIN_LATITUDE_COSINE = 0.01

const NAME_KEYS = ['name', 'ref'] as const

type PlaceKind = 'point' | 'line' | 'area' | 'relation'

function placeKind(change: ElementChange): PlaceKind {
  if (change.type === 'node') return 'point'
  if (change.type === 'relation') return 'relation'
  return change.wayShape?.closed ? 'area' : 'line'
}

function createUnionFind(size: number) {
  const parent = Array.from({ length: size }, (_, index) => index)
  function find(index: number): number {
    let node = index
    for (;;) {
      const next = parent[node] ?? node
      if (next === node) return node
      // Path halving keeps the trees flat.
      const grandparent = parent[next] ?? next
      parent[node] = grandparent
      node = grandparent
    }
  }
  /** The smaller index stays the root, so a cluster is labelled by its first member. */
  function union(left: number, right: number) {
    const leftRoot = find(left)
    const rightRoot = find(right)
    if (leftRoot === rightRoot) return
    if (leftRoot < rightRoot) parent[rightRoot] = leftRoot
    else parent[leftRoot] = rightRoot
  }
  return { find, union }
}

type UnionFind = ReturnType<typeof createUnionFind>

function longitudeScale(latitude: number): number {
  const cosine = Math.cos((latitude * Math.PI) / 180)
  return Math.max(Math.abs(cosine), MIN_LATITUDE_COSINE)
}

/** Equirectangular approximation: accurate enough for distances of tens of meters. */
function distanceMeters(left: LonLat, right: LonLat): number {
  const scale = longitudeScale((left.lat + right.lat) / 2)
  const dx = (left.lon - right.lon) * METERS_PER_DEGREE * scale
  const dy = (left.lat - right.lat) * METERS_PER_DEGREE
  return Math.hypot(dx, dy)
}

type GridPoint = { owner: number; at: LonLat }

/**
 * Links owners whose points lie within `threshold` meters, comparing only points in neighbouring
 * grid cells. Cells are at least `threshold` wide, so a closer point is always in the same or an
 * adjacent cell. Longitude cells are scaled per latitude row.
 */
function linkNearbyPoints(
  points: GridPoint[],
  threshold: number,
  unionFind: UnionFind,
  canLink: (left: number, right: number) => boolean = () => true,
) {
  const cells = new Map<string, GridPoint[]>()
  const rowOf = (lat: number) => Math.floor((lat * METERS_PER_DEGREE) / threshold)
  const colOf = (lon: number, row: number) => {
    const rowLatitude = ((row + 0.5) * threshold) / METERS_PER_DEGREE
    return Math.floor((lon * METERS_PER_DEGREE * longitudeScale(rowLatitude)) / threshold)
  }

  for (const point of points) {
    const row = rowOf(point.at.lat)
    for (let nearRow = row - 1; nearRow <= row + 1; nearRow++) {
      const col = colOf(point.at.lon, nearRow)
      for (let nearCol = col - 1; nearCol <= col + 1; nearCol++) {
        for (const other of cells.get(`${nearRow}:${nearCol}`) ?? []) {
          if (unionFind.find(point.owner) === unionFind.find(other.owner)) continue
          if (distanceMeters(point.at, other.at) > threshold) continue
          if (canLink(point.owner, other.owner)) unionFind.union(point.owner, other.owner)
        }
      }
    }
    const key = `${row}:${colOf(point.at.lon, row)}`
    const cell = cells.get(key)
    if (cell) cell.push(point)
    else cells.set(key, [point])
  }
}

/** Links owners that list the same node ref. `canLink` can veto a pair. */
function linkSharedRefs(
  refsByOwner: Array<[owner: number, refs: number[]]>,
  unionFind: UnionFind,
  canLink: (left: number, right: number) => boolean = () => true,
) {
  const ownersByRef = new Map<number, number[]>()
  for (const [owner, refs] of refsByOwner) {
    for (const ref of new Set(refs)) {
      const owners = ownersByRef.get(ref)
      if (!owners) {
        ownersByRef.set(ref, [owner])
        continue
      }
      for (const other of owners) {
        if (unionFind.find(owner) !== unionFind.find(other) && canLink(owner, other)) {
          unionFind.union(owner, other)
        }
      }
      owners.push(owner)
    }
  }
}

/** The tag value after the change; a removed tag falls back to its old value. */
function tagValue(change: ElementChange, key: string): string | undefined {
  const row = change.tags.find((tag) => tag.key === key)
  if (!row) return undefined
  return row.kind === 'changed' ? row.newValue : row.value
}

function boundsGapMeters(
  left: NonNullable<WayShape['bounds']>,
  right: NonNullable<WayShape['bounds']>,
): number {
  const latGap = Math.max(0, left.minLat - right.maxLat, right.minLat - left.maxLat)
  const lonGap = Math.max(0, left.minLon - right.maxLon, right.minLon - left.maxLon)
  const middleLat = (left.minLat + left.maxLat + right.minLat + right.maxLat) / 4
  return Math.hypot(
    lonGap * METERS_PER_DEGREE * longitudeScale(middleLat),
    latGap * METERS_PER_DEGREE,
  )
}

function clusterPoints(members: number[], changes: ElementChange[], unionFind: UnionFind) {
  const points: GridPoint[] = []
  for (const owner of members) {
    const { lat, lon } = changes[owner] ?? {}
    if (lat != null && lon != null && Number.isFinite(lat) && Number.isFinite(lon)) {
      points.push({ owner, at: { lat, lon } })
    }
  }
  linkNearbyPoints(points, POINT_LINK_METERS, unionFind)
}

function clusterLines(members: number[], changes: ElementChange[], unionFind: UnionFind) {
  const usable: number[] = []
  const points: GridPoint[] = []
  const refsByOwner: Array<[number, number[]]> = []
  for (const owner of members) {
    const shape = changes[owner]?.wayShape
    if (!shape || shape.refs.length < 2) continue
    const ends = [shape.first, shape.last].filter((end) => end != null)
    if (ends.length === 0) continue
    usable.push(owner)
    refsByOwner.push([owner, shape.refs])
    for (const at of ends) points.push({ owner, at })
  }

  const names = new Map<number, Array<string | undefined>>()
  for (const owner of usable) {
    const change = changes[owner]
    if (change)
      names.set(
        owner,
        NAME_KEYS.map((key) => tagValue(change, key)),
      )
  }
  const compatible = (left: number, right: number) => {
    const leftNames = names.get(left) ?? []
    const rightNames = names.get(right) ?? []
    return NAME_KEYS.every((_, index) => {
      const leftValue = leftNames[index]
      const rightValue = rightNames[index]
      return leftValue == null || rightValue == null || leftValue === rightValue
    })
  }

  linkSharedRefs(refsByOwner, unionFind, compatible)
  linkNearbyPoints(points, LINE_LINK_METERS, unionFind, compatible)
}

function clusterAreas(members: number[], changes: ElementChange[], unionFind: UnionFind) {
  type Box = { owner: number; bounds: NonNullable<WayShape['bounds']> }
  const boxes: Box[] = []
  const refsByOwner: Array<[number, number[]]> = []
  for (const owner of members) {
    const shape = changes[owner]?.wayShape
    if (!shape?.bounds) continue
    boxes.push({ owner, bounds: shape.bounds })
    refsByOwner.push([owner, shape.refs])
  }
  linkSharedRefs(refsByOwner, unionFind)

  // Sweep south to north. A box stays active until it ends too far south to matter for any later one.
  const thresholdDegrees = AREA_LINK_METERS / METERS_PER_DEGREE
  boxes.sort((left, right) => left.bounds.minLat - right.bounds.minLat || left.owner - right.owner)
  const active: Box[] = []
  for (const box of boxes) {
    const limit = box.bounds.minLat - thresholdDegrees
    let kept = 0
    for (const other of active) {
      if (other.bounds.maxLat < limit) continue
      active[kept++] = other
      if (unionFind.find(box.owner) === unionFind.find(other.owner)) continue
      if (boundsGapMeters(box.bounds, other.bounds) <= AREA_LINK_METERS) {
        unionFind.union(box.owner, other.owner)
      }
    }
    active.length = kept
    active.push(box)
  }
}

/**
 * Splits changes that already share their tag change into places. Returns one label per change;
 * equal labels mean the same place. Single linkage: A–B and B–C linked puts all three together.
 *
 * - Points (nodes) are linked within `POINT_LINK_METERS`.
 * - Lines (open ways) share a node or end within `LINE_LINK_METERS`, unless both have a `name`
 *   (or both a `ref`) and the values differ.
 * - Areas (closed ways) share a node or have bounding boxes within `AREA_LINK_METERS`.
 * - Relations are not clustered: they all share one label.
 * - Kinds never mix. A change without usable coordinates is its own place.
 */
export function clusterChangesBySpace(changes: ElementChange[]): number[] {
  const unionFind = createUnionFind(changes.length)
  const membersByKind: Record<PlaceKind, number[]> = { point: [], line: [], area: [], relation: [] }
  changes.forEach((change, index) => membersByKind[placeKind(change)].push(index))

  clusterPoints(membersByKind.point, changes, unionFind)
  clusterLines(membersByKind.line, changes, unionFind)
  clusterAreas(membersByKind.area, changes, unionFind)
  const [firstRelation, ...otherRelations] = membersByKind.relation
  if (firstRelation != null) {
    for (const relation of otherRelations) unionFind.union(firstRelation, relation)
  }

  return changes.map((_, index) => unionFind.find(index))
}
