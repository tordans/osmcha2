import { BubbleSets, type ICircle, type ILine, type IRectangle, PointPath } from 'bubblesets-js'

/**
 * A rubber-band outline around the members of a "Same tag changes" group (a Bubble Set): it wraps
 * the members snugly, thins to a neck between members that lie apart and squeezes around other
 * elements. Everything here works in pixels at one fixed zoom; the caller projects in and out. This
 * module is the only place that imports `bubblesets-js`, and it loads lazily.
 */

export type Pixel = { x: number; y: number }
export type PixelShape = { kind: 'point'; at: Pixel } | { kind: 'line'; points: readonly Pixel[] }

/** Pixel values that decide how the band looks and how much work it costs. */
export const OUTLINE_TUNING = {
  /** The gap wanted between the band and the drawn edge of a member: 7 to 10 px. */
  gap: 9.6,
  /**
   * Half the width a member is drawn with: a tagged node's dark ring (`changeset-node-tagged-bg`), a
   * line's dark casing (`changeset-way-bg`). The band keeps its gap beyond these.
   */
  drawn: { point: 9, line: 4 },
  /** Smallest circle a member is fed to the algorithm as. */
  minMemberRadius: 2,
  /** Cells closer than this are one member when sampling. */
  memberSize: 6,
  /** Energy 1 (the band's edge) lies this far from a member circle. */
  nodeR0: 8,

  /** Half width of the band along member lines (`4 + gap`), and of the neck between members. */
  edgeR0: 11.2,
  /**
   * How far the influence of members (`nodeR1`) and of lines and necks (`edgeR1`) reaches. A short
   * reach keeps the band close to the nominal gap; members and necks that then fail to join into
   * one band are tried again with the longer reach.
   */
  reaches: [
    { nodeR1: 14, edgeR1: 16, shrink: 0 },
    // The longer reach lets the band swell by about this much more: members and edges start smaller.
    { nodeR1: 28, edgeR1: 26, shrink: 4 },
  ],
  /** How far the neck swings around an obstacle. */
  morphBuffer: 8,
  /** Members get one circle per this much line length at most. */
  memberSpacing: 60,
  /** Bounds for the member squares the library may route around obstacles. */
  minMembers: 40,
  maxMembers: 300,
  /** Members times obstacles the routing step may compare (squared members x obstacles). */
  routingBudget: 1_000_000,
  /** Groups with more member circles than this start with the longer reach. */
  longReachFrom: 120,
  /** Upper bound for member squares; merging and sparser sampling kick in beyond it. */
  candidateMembers: 1500,
  /** Member squares closer than this are merged into one when there are too many. */
  maxMemberMerge: 16,
  /** Member lines are fed to the algorithm in pieces of at most this length. */
  maxEdgeLength: 60,
  maxEdges: 300,
  /** Obstacle squares sit this far apart along other elements' lines. */
  obstacleSpacing: 10,
  obstacleSize: 6,
  /** Obstacles closer than this to a member are skipped: they could never be kept out. */
  clearance: 9,
  /** Obstacles further than this from every member cannot reach the band. */
  obstacleReach: 70,
  maxObstacles: 400,
  /** Pixels per cell of the energy grid. `MAX_GROUP_PIXELS` bounds the size of the grid. */
  pixelGroup: 3,
  /** Corner tolerance in px for the calm outline, calmest first (see `smoothWithin`). */
  calmTolerances: [5, 3.5, 2.5, 1.5],
  /** Rounds of corner cutting after simplifying. */
  cornerRounds: 3,
  /** Corners checked against the finished band. */
  maxProbes: 400,
  /** The band must clear the drawn edge of a member by at least this much at a probe. */
  probeGap: 3,
  /** Non-member influence tried in turn (the library default is -0.8). */
  squeezeSteps: [-0.8, -0.3],
} as const

export type OutlineStats = {
  members: number
  obstacles: number
  edges: number
  /** Milliseconds spent in `computeTagGroupOutline`. */
  ms: number
  /** The members-only band: no way was found around the obstacles. */
  ignoredObstacles: boolean
  smoothed: boolean
  /** How hard other elements pushed the band in: 0.8 is full, less where members would be cut. */
  squeeze: number
  /** The node reach (`nodeR1`) the band was found with: the short one is the tight one. */
  reach: number
}

export type TagGroupOutline = {
  ring: Pixel[]
  /** Where the label goes: the centre of mass, or the nearest spot inside for a bent shape. */
  labelAt: Pixel
  stats: OutlineStats
}

type Rect = { minX: number; minY: number; maxX: number; maxY: number }

function pad(rect: Rect, by: number): Rect {
  return { minX: rect.minX - by, minY: rect.minY - by, maxX: rect.maxX + by, maxY: rect.maxY + by }
}

function boundsOf(points: readonly Pixel[]): Rect | null {
  const first = points[0]
  if (!first) return null
  const rect = { minX: first.x, minY: first.y, maxX: first.x, maxY: first.y }
  for (const point of points) {
    rect.minX = Math.min(rect.minX, point.x)
    rect.minY = Math.min(rect.minY, point.y)
    rect.maxX = Math.max(rect.maxX, point.x)
    rect.maxY = Math.max(rect.maxY, point.y)
  }
  return rect
}

/** Liang–Barsky: the part of a segment inside `rect`, or `null`. */
function clipSegment(from: Pixel, to: Pixel, rect: Rect): [Pixel, Pixel] | null {
  const dx = to.x - from.x
  const dy = to.y - from.y
  let enter = 0
  let leave = 1
  const edges: Array<[number, number]> = [
    [-dx, from.x - rect.minX],
    [dx, rect.maxX - from.x],
    [-dy, from.y - rect.minY],
    [dy, rect.maxY - from.y],
  ]
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return null
      continue
    }
    const t = q / p
    if (p < 0) {
      if (t > leave) return null
      enter = Math.max(enter, t)
    } else {
      if (t < enter) return null
      leave = Math.min(leave, t)
    }
  }
  return [
    { x: from.x + enter * dx, y: from.y + enter * dy },
    { x: from.x + leave * dx, y: from.y + leave * dy },
  ]
}

/** The parts of a line inside `rect`, each a continuous run. */
function clipLine(points: readonly Pixel[], rect: Rect): Pixel[][] {
  const pieces: Pixel[][] = []
  let current: Pixel[] | null = null
  for (let index = 1; index < points.length; index++) {
    const from = points[index - 1]!
    const to = points[index]!
    const clipped = clipSegment(from, to, rect)
    if (!clipped) {
      current = null
      continue
    }
    const [start, end] = clipped
    const continues = current != null && start.x === from.x && start.y === from.y
    if (!continues || !current) {
      current = [start]
      pieces.push(current)
    }
    current.push(end)
    // A clipped end means the line left the window; the next run starts afresh.
    if (end.x !== to.x || end.y !== to.y) current = null
  }
  return pieces
}

/** Douglas–Peucker, iterative so a long line cannot overflow the stack. */
function simplifyLine(points: readonly Pixel[], tolerance: number): Pixel[] {
  if (points.length < 3) return [...points]
  const keep = new Uint8Array(points.length)
  keep[0] = 1
  keep[points.length - 1] = 1
  const stack: Array<[number, number]> = [[0, points.length - 1]]
  while (stack.length > 0) {
    const [first, last] = stack.pop()!
    const a = points[first]!
    const b = points[last]!
    let farthest = -1
    let farthestDistance = tolerance
    for (let index = first + 1; index < last; index++) {
      const distance = segmentDistance(a, b, points[index]!)
      if (distance > farthestDistance) {
        farthest = index
        farthestDistance = distance
      }
    }
    if (farthest >= 0) {
      keep[farthest] = 1
      stack.push([first, farthest], [farthest, last])
    }
  }
  return points.filter((_, index) => keep[index] === 1)
}

function segmentDistance(a: Pixel, b: Pixel, p: Pixel) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSquared = dx * dx + dy * dy
  const t =
    lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

/** Points along a line, `spacing` apart, always including both ends. */
function sampleLine(points: readonly Pixel[], spacing: number): Pixel[] {
  const first = points[0]
  if (!first) return []
  const samples = [first]
  let untilNext = spacing
  for (let index = 1; index < points.length; index++) {
    const from = points[index - 1]!
    const to = points[index]!
    const length = Math.hypot(to.x - from.x, to.y - from.y)
    let at = untilNext
    while (at < length) {
      const t = at / length
      samples.push({ x: from.x + t * (to.x - from.x), y: from.y + t * (to.y - from.y) })
      at += spacing
    }
    untilNext = at - length
  }
  const last = points[points.length - 1]!
  const lastSample = samples[samples.length - 1]!
  if (lastSample.x !== last.x || lastSample.y !== last.y) samples.push(last)
  return samples
}

function chopLine(points: readonly Pixel[], maxLength: number): ILine[] {
  const lines: ILine[] = []
  for (let index = 1; index < points.length; index++) {
    const from = points[index - 1]!
    const to = points[index]!
    const length = Math.hypot(to.x - from.x, to.y - from.y)
    const parts = Math.max(1, Math.ceil(length / maxLength))
    for (let part = 0; part < parts; part++) {
      const t0 = part / parts
      const t1 = (part + 1) / parts
      lines.push({
        x1: from.x + t0 * (to.x - from.x),
        y1: from.y + t0 * (to.y - from.y),
        x2: from.x + t1 * (to.x - from.x),
        y2: from.y + t1 * (to.y - from.y),
      })
    }
  }
  return lines
}

/** Points hashed by cell: neighbour search and "one point per cell" without a tree. */
class PointGrid {
  private readonly cells = new Map<string, Pixel[]>()
  readonly cell: number

  constructor(cell: number) {
    this.cell = cell
  }

  private key(column: number, row: number) {
    return `${column}:${row}`
  }

  add(point: Pixel) {
    const key = this.key(Math.floor(point.x / this.cell), Math.floor(point.y / this.cell))
    const cell = this.cells.get(key)
    if (cell) cell.push(point)
    else this.cells.set(key, [point])
  }

  /** Whether a point lies in the cell of `point` already. */
  occupied(point: Pixel) {
    return this.cells.has(
      this.key(Math.floor(point.x / this.cell), Math.floor(point.y / this.cell)),
    )
  }

  /** Distance to the nearest point within `limit` (at most one cell), else `Infinity`. */
  nearest(point: Pixel, limit: number) {
    const reach = Math.ceil(limit / this.cell)
    const column = Math.floor(point.x / this.cell)
    const row = Math.floor(point.y / this.cell)
    let best = Number.POSITIVE_INFINITY
    for (let dx = -reach; dx <= reach; dx++) {
      for (let dy = -reach; dy <= reach; dy++) {
        for (const other of this.cells.get(this.key(column + dx, row + dy)) ?? []) {
          const distance = Math.hypot(other.x - point.x, other.y - point.y)
          if (distance < best) best = distance
        }
      }
    }
    return best
  }
}

/** Keeps one point per cell; the first of a cell wins. */
function thin<T extends Pixel>(points: readonly T[], cell: number): T[] {
  const grid = new PointGrid(cell)
  const kept: T[] = []
  for (const point of points) {
    if (grid.occupied(point)) continue
    grid.add(point)
    kept.push(point)
  }
  return kept
}

type MemberGeometry = {
  /** Single points: nodes. */
  points: Pixel[]
  /** Lines, simplified. */
  lines: Pixel[][]
}

function memberGeometry(members: readonly PixelShape[]): MemberGeometry {
  const points: Pixel[] = []
  // An element that kept its geometry has the same line twice, old and new.
  const lines = new Map<string, Pixel[]>()
  for (const shape of members) {
    if (shape.kind === 'point') points.push(shape.at)
    else lines.set(JSON.stringify(shape.points), simplifyLine(shape.points, 1.5))
  }
  return { points, lines: [...lines.values()] }
}

/** A member circle: where it is, and how large, so the band lies `gap` beyond what is drawn there. */
type Sample = Pixel & { radius: number }

function memberRadius(symbol: number) {
  const { gap, nodeR0, minMemberRadius } = OUTLINE_TUNING
  return Math.max(minMemberRadius, symbol + gap - nodeR0)
}

/** Member squares up to `limit`: near ones merge first, line samples thin out next, then merge on. */
function memberSamples(geometry: MemberGeometry, limit: number): Sample[] {
  const { memberSpacing, memberSize, maxMemberMerge, drawn } = OUTLINE_TUNING
  let spacing: number = memberSpacing
  let cell: number = memberSize
  for (;;) {
    // The first of near squares stays. Nodes come first, they are drawn wider, then one point of
    // every line: only a member with a square is linked to the others.
    const raw: Sample[] = [
      ...geometry.points.map((at) => ({ ...at, radius: memberRadius(drawn.point) })),
      ...[
        ...geometry.lines.map((line) => line[0]!),
        ...geometry.lines.flatMap((line) => sampleLine(line, spacing)),
      ].map((at) => ({ ...at, radius: memberRadius(drawn.line) })),
    ]
    const samples = thin(raw, cell)
    if (samples.length <= limit) return samples
    // Squares closer than the band is wide add nothing, so merge those first. Merging further
    // leaves members outside the band: only when there is no other way to stay in the budget.
    if (cell < maxMemberMerge) cell = Math.min(maxMemberMerge, cell * 1.5)
    else if (spacing < memberSpacing * 4) spacing *= 1.5
    else cell *= 1.25
  }
}

/** The routing step compares every member with every obstacle: bound members by obstacles. */
function memberBudget(obstacleCount: number) {
  const { routingBudget, minMembers, maxMembers } = OUTLINE_TUNING
  return Math.max(
    minMembers,
    Math.min(maxMembers, Math.floor(Math.sqrt(routingBudget / (obstacleCount + 20)))),
  )
}

/** Member lines as short pieces. */
function memberEdges(geometry: MemberGeometry): ILine[] {
  let maxLength: number = OUTLINE_TUNING.maxEdgeLength
  for (let attempt = 0; ; attempt++) {
    const edges = geometry.lines.flatMap((line) => chopLine(line, maxLength))
    if (edges.length <= OUTLINE_TUNING.maxEdges || attempt >= 4) return edges
    maxLength *= 1.6
  }
}

/**
 * The straight links the band follows between members: each member to the nearest one already
 * linked (a minimum spanning tree). Elements on these links are the ones that can squeeze the neck.
 */
function memberLinks(samples: readonly Pixel[]): Array<[Pixel, Pixel]> {
  const first = samples[0]
  if (!first) return []
  const links: Array<[Pixel, Pixel]> = []
  const nearest = samples.map((sample) => ({
    distance: Math.hypot(sample.x - first.x, sample.y - first.y),
    to: first,
  }))
  const linked = new Set<number>([0])
  while (linked.size < samples.length) {
    let next = -1
    for (let index = 0; index < samples.length; index++) {
      if (linked.has(index)) continue
      if (next < 0 || nearest[index]!.distance < nearest[next]!.distance) next = index
    }
    const added = samples[next]!
    links.push([nearest[next]!.to, added])
    linked.add(next)
    for (let index = 0; index < samples.length; index++) {
      if (linked.has(index)) continue
      const distance = Math.hypot(samples[index]!.x - added.x, samples[index]!.y - added.y)
      if (distance < nearest[index]!.distance) nearest[index] = { distance, to: added }
    }
  }
  return links
}

/**
 * Squares for the other elements near the members or their links, nearest first, without those
 * sitting on a member. `reachGrid` holds what counts as "near", `memberGrid` what is a member.
 */
function obstacleSquares(
  obstacles: readonly PixelShape[],
  region: Rect,
  memberGrid: PointGrid,
  reachGrid: PointGrid,
): Pixel[] {
  const { obstacleSpacing, clearance, obstacleReach, maxObstacles } = OUTLINE_TUNING
  const candidates: Pixel[] = []
  for (const shape of obstacles) {
    if (shape.kind === 'point') {
      if (clipSegment(shape.at, shape.at, region)) candidates.push(shape.at)
      continue
    }
    for (const piece of clipLine(shape.points, region)) {
      candidates.push(...sampleLine(simplifyLine(piece, 1), obstacleSpacing))
    }
  }
  const ranked: Array<{ at: Pixel; distance: number }> = []
  for (const at of thin(candidates, obstacleSpacing / 2)) {
    const distance = reachGrid.nearest(at, obstacleReach)
    if (distance > obstacleReach) continue
    if (memberGrid.nearest(at, clearance) < clearance) continue
    ranked.push({ at, distance })
  }
  ranked.sort((left, right) => left.distance - right.distance)
  return ranked.slice(0, maxObstacles).map((entry) => entry.at)
}

function square(at: Pixel, size: number): IRectangle {
  return { x: at.x - size / 2, y: at.y - size / 2, width: size, height: size }
}

type Probe = { at: Pixel; symbol: number }

/** Ray casting. The library's `withinArea` allocates and cannot keep up with long outlines. */
function insideRing(ring: readonly Pixel[], x: number, y: number) {
  let result = false
  let previous = ring[ring.length - 1]!
  for (const point of ring) {
    if (
      point.y > y !== previous.y > y &&
      x < ((previous.x - point.x) * (y - point.y)) / (previous.y - point.y) + point.x
    ) {
      result = !result
    }
    previous = point
  }
  return result
}

/** The band holds the probe and keeps `probeGap` from the edge of what is drawn there. */
function covers(path: PointPath, probes: readonly Probe[]) {
  const { probeGap } = OUTLINE_TUNING
  const ring = path.points
  return probes.every(({ at, symbol }) => {
    if (!insideRing(ring, at.x, at.y)) return false
    const reach = symbol + probeGap
    return (
      insideRing(ring, at.x + reach, at.y) &&
      insideRing(ring, at.x - reach, at.y) &&
      insideRing(ring, at.x, at.y + reach) &&
      insideRing(ring, at.x, at.y - reach)
    )
  })
}

/** Corner cutting: every corner is replaced by two points a quarter in, so corners round off. */
function centreOfMass(ring: readonly Pixel[]): Pixel {
  let doubledArea = 0
  let x = 0
  let y = 0
  ring.forEach((from, index) => {
    const to = ring[(index + 1) % ring.length]!
    const cross = from.x * to.y - to.x * from.y
    doubledArea += cross
    x += (from.x + to.x) * cross
    y += (from.y + to.y) * cross
  })
  return { x: x / (3 * doubledArea), y: y / (3 * doubledArea) }
}

/** How far along the ray from `start` towards `through` it crosses the ring, nearest first. */
function rayCrossings(ring: readonly Pixel[], start: Pixel, through: Pixel) {
  const dx = through.x - start.x
  const dy = through.y - start.y
  const crossings: number[] = []
  ring.forEach((from, index) => {
    const to = ring[(index + 1) % ring.length]!
    const edgeX = to.x - from.x
    const edgeY = to.y - from.y
    const denominator = dx * edgeY - dy * edgeX
    if (denominator === 0) return
    const along = ((from.x - start.x) * edgeY - (from.y - start.y) * edgeX) / denominator
    const onEdge = ((from.x - start.x) * dy - (from.y - start.y) * dx) / denominator
    if (along > 0 && onEdge >= 0 && onEdge < 1) crossings.push(along)
  })
  return crossings.sort((a, b) => a - b)
}

/**
 * The centre of mass of a bent shape can lie outside it. Then the label goes to the middle of the
 * band on the way to the nearest edge.
 */
export function labelPoint(ring: readonly Pixel[]): Pixel {
  const centre = centreOfMass(ring)
  if (insideRing(ring, centre.x, centre.y)) return centre
  const nearest = ring.reduce((best, point) =>
    Math.hypot(point.x - centre.x, point.y - centre.y) <
    Math.hypot(best.x - centre.x, best.y - centre.y)
      ? point
      : best,
  )
  const [enter, leave] = rayCrossings(ring, centre, nearest)
  if (enter == null || leave == null) return nearest
  const middle = (enter + leave) / 2
  return {
    x: centre.x + (nearest.x - centre.x) * middle,
    y: centre.y + (nearest.y - centre.y) * middle,
  }
}

function chaikin(points: readonly Pixel[], rounds: number): Pixel[] {
  let current = [...points]
  for (let round = 0; round < rounds; round++) {
    const next: Pixel[] = []
    for (let index = 0; index < current.length; index++) {
      const from = current[index]!
      const to = current[(index + 1) % current.length]!
      next.push(
        { x: 0.75 * from.x + 0.25 * to.x, y: 0.75 * from.y + 0.25 * to.y },
        { x: 0.25 * from.x + 0.75 * to.x, y: 0.25 * from.y + 0.75 * to.y },
      )
    }
    current = next
  }
  return current
}

/**
 * A calm outline: the staircase of the contour is reduced to few corners (long straight runs),
 * then the corners are rounded off. Straight where the members run straight, round at the ends.
 */
function calm(path: PointPath, tolerance: number) {
  const simplified = path.simplify(tolerance)
  if (simplified.length < 3) return null
  return new PointPath(chaikin(simplified.points, OUTLINE_TUNING.cornerRounds))
}

/**
 * The calmest outline that still holds every probe: few corners first, finer ones when cutting
 * corners would leave a member out or crowd its symbol; then spline smoothing, then the raw
 * staircase, else `null`.
 */
function smoothWithin(path: PointPath, probes: readonly Probe[]) {
  for (const tolerance of OUTLINE_TUNING.calmTolerances) {
    const smoothed = calm(path, tolerance)
    if (smoothed && covers(smoothed, probes)) return { path: smoothed, smoothed: true }
  }
  for (const skip of [4, 6, 8]) {
    const smoothed = path.sample(skip).simplify(0).bSplines().simplify(0)
    if (smoothed.length >= 3 && covers(smoothed, probes)) return { path: smoothed, smoothed: true }
  }
  return covers(path, probes) ? { path, smoothed: false } : null
}

type Reach = (typeof OUTLINE_TUNING.reaches)[number]

function runBubbleSets(
  members: readonly ICircle[],
  obstacles: readonly IRectangle[],
  edges: readonly ILine[],
  nonMemberInfluenceFactor: number,
  { nodeR1, edgeR1, shrink }: Reach,
  virtualEdges: boolean,
) {
  const bubbleSets = new BubbleSets({
    pixelGroup: OUTLINE_TUNING.pixelGroup,
    nodeR0: OUTLINE_TUNING.nodeR0,
    nodeR1,
    edgeR0: OUTLINE_TUNING.edgeR0 - shrink,
    edgeR1,
    morphBuffer: OUTLINE_TUNING.morphBuffer,
    maxRoutingIterations: 25,
    virtualEdges,
    nonMemberInfluenceFactor,
  })
  bubbleSets.pushMember(
    ...members.map((member) => ({
      ...member,
      radius: Math.max(OUTLINE_TUNING.minMemberRadius, member.radius - shrink),
    })),
  )
  bubbleSets.pushNonMember(...obstacles)
  bubbleSets.pushEdge(...edges)
  return bubbleSets.compute()
}

/** Corners of member lines and single members, at most `limit`: what the band must hold. */
function memberProbes(geometry: MemberGeometry, limit: number): Probe[] {
  const { drawn } = OUTLINE_TUNING
  const all: Probe[] = [
    ...geometry.points.map((at) => ({ at, symbol: drawn.point })),
    ...geometry.lines.flatMap((line) => line.map((at) => ({ at, symbol: drawn.line }))),
  ]
  const stride = Math.max(1, Math.ceil(all.length / limit))
  return all.filter((_, index) => index % stride === 0)
}

/** The band around `members`, kept off `obstacles`. Returns `null` when there is nothing to draw. */
export function computeTagGroupOutline(input: {
  members: readonly PixelShape[]
  obstacles: readonly PixelShape[]
}): TagGroupOutline | null {
  const started = performance.now()
  const geometry = memberGeometry(input.members)
  const candidates = memberSamples(geometry, OUTLINE_TUNING.candidateMembers)
  if (candidates.length === 0) return null
  const edges = memberEdges(geometry)

  const memberBounds = boundsOf([
    ...candidates,
    ...edges.flatMap((edge) => [
      { x: edge.x1, y: edge.y1 },
      { x: edge.x2, y: edge.y2 },
    ]),
  ])!
  const region = pad(memberBounds, OUTLINE_TUNING.obstacleReach)
  const memberGrid = new PointGrid(16)
  for (const sample of candidates) memberGrid.add(sample)
  for (const line of geometry.lines) for (const at of sampleLine(line, 5)) memberGrid.add(at)
  const reachGrid = new PointGrid(16)
  const links = memberLinks(candidates)
  for (const [from, to] of links) for (const at of sampleLine([from, to], 8)) reachGrid.add(at)
  for (const line of geometry.lines) for (const at of sampleLine(line, 5)) reachGrid.add(at)
  const obstacleSamples = obstacleSquares(input.obstacles, region, memberGrid, reachGrid)

  // Past the budget the library's routing around obstacles and its check of every member against
  // the outline are too slow. Straight links join the members just as well and the obstacles still
  // push the band in; lines then need no circles, and the band is checked by `covers` alone.
  const routed = candidates.length <= memberBudget(obstacleSamples.length)
  const lineRadius = memberRadius(OUTLINE_TUNING.drawn.line)
  const circles = routed
    ? candidates
    : [candidates[0]!, ...candidates.filter((at) => at.radius > lineRadius)]
  const bandEdges = routed
    ? edges
    : [...edges, ...links.map(([from, to]) => ({ x1: from.x, y1: from.y, x2: to.x, y2: to.y }))]
  const memberCircles: ICircle[] = circles.map((at) => ({ cx: at.x, cy: at.y, radius: at.radius }))
  const obstacleSquaresList = obstacleSamples.map((at) => square(at, OUTLINE_TUNING.obstacleSize))

  // Squeezing around neighbours may cut into a member that touches one (two buildings sharing a
  // wall). The band must hold its members, so weaken the squeeze until it does.
  const probes = memberProbes(geometry, OUTLINE_TUNING.maxProbes)
  let result: { path: PointPath; smoothed: boolean } | null = null
  let squeeze = 0
  let usedReach: Reach = OUTLINE_TUNING.reaches[0]
  // Big groups rarely join under the short reach: do not pay for a run that is bound to fail.
  const reaches =
    candidates.length > OUTLINE_TUNING.longReachFrom
      ? OUTLINE_TUNING.reaches.slice(-1)
      : OUTLINE_TUNING.reaches
  for (const reachSet of reaches) {
    usedReach = reachSet
    for (const factor of OUTLINE_TUNING.squeezeSteps) {
      squeeze = factor
      const path = runBubbleSets(
        memberCircles,
        obstacleSquaresList,
        bandEdges,
        factor,
        reachSet,
        routed,
      )
      if (path.length < 3) break
      result = smoothWithin(path, probes)
      if (result || obstacleSquaresList.length === 0) break
    }
    if (result) break
  }
  let ignoredObstacles = false
  if (!result) {
    // No squeeze keeps every member inside: wrap the members alone.
    ignoredObstacles = true
    const longest = OUTLINE_TUNING.reaches.at(-1)!
    const path = runBubbleSets(memberCircles, [], bandEdges, 0, longest, routed)
    if (path.length < 3) return null
    result = smoothWithin(path, probes) ?? { path, smoothed: false }
  }
  const ring = [...result.path.points]
  return {
    ring,
    labelAt: labelPoint(ring),
    stats: {
      members: candidates.length,
      obstacles: obstacleSamples.length,
      edges: edges.length,
      ms: performance.now() - started,
      ignoredObstacles,
      smoothed: result.smoothed,
      squeeze: Math.abs(squeeze),
      reach: ignoredObstacles ? OUTLINE_TUNING.reaches.at(-1)!.nodeR1 : usedReach.nodeR1,
    },
  }
}
