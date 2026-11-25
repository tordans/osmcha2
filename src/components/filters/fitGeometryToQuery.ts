import area from '@turf/area'
import bbox from '@turf/bbox'
import simplify from '@turf/simplify'

type Position = GeoJSON.Position
type Ring = Position[]
type PolygonCoords = Ring[]
type AreaGeometry = GeoJSON.Polygon | GeoJSON.MultiPolygon

/**
 * How many URL-encoded bytes the review area may take in the changeset list request.
 * OSMCha's server refuses a request line over 4096 bytes (OSMCha/osmcha-frontend#933).
 * The rest is left for the path, paging and the other filters.
 */
export const GEOMETRY_QUERY_BUDGET = 3000

/**
 * `exact`: fit at the start tolerance, nothing to tell the user. `simplified`: coarser than that,
 * holes filled or small parts dropped. `bbox`: only the bounding box fit.
 */
export type GeometryFit = 'exact' | 'simplified' | 'bbox'

export type FittedGeometry = { geometry: AreaGeometry; fit: GeometryFit }

const MAX_STEPS = 14

/** A simplified area must keep this share of the original; less, and the bounding box is used. */
const MIN_KEPT_AREA_SHARE = 0.9

/** Length of the geometry as it goes into the list request's query string. */
export function encodedGeometryLength(geometry: unknown): number {
  return encodeURIComponent(JSON.stringify(geometry)).length
}

function polygonsOf(geometry: AreaGeometry): PolygonCoords[] {
  return geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
}

function geometryOf(polygons: PolygonCoords[]): AreaGeometry {
  return polygons.length === 1
    ? { type: 'Polygon', coordinates: polygons[0]! }
    : { type: 'MultiPolygon', coordinates: polygons }
}

/** Rounds a ring to `digits` decimals and drops repeated positions. Null when too few positions are left. */
function roundRing(ring: Ring, digits: number): Ring | null {
  const factor = 10 ** digits
  const rounded: Ring = []
  for (const position of ring) {
    const next = [
      Math.round(position[0]! * factor) / factor,
      Math.round(position[1]! * factor) / factor,
    ]
    const last = rounded.at(-1)
    if (last && last[0] === next[0] && last[1] === next[1]) continue
    rounded.push(next)
  }
  const first = rounded[0]
  const last = rounded.at(-1)
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) rounded.push([...first])
  return rounded.length >= 4 ? rounded : null
}

function polygonArea(coordinates: PolygonCoords): number {
  return area({ type: 'Polygon', coordinates })
}

/** Decimals that keep rounding well below the simplification tolerance (in degrees). */
function digitsFor(tolerance: number): number {
  if (tolerance <= 0) return 6
  return Math.min(6, Math.max(2, Math.ceil(-Math.log10(tolerance)) + 1))
}

/** Rounds to `digits` decimals and optionally fills holes. */
function roundGeometry(
  geometry: AreaGeometry,
  digits: number,
  fillHoles: boolean,
): AreaGeometry | null {
  const polygons = polygonsOf(geometry).flatMap((polygon): PolygonCoords[] => {
    const rings = fillHoles ? polygon.slice(0, 1) : polygon
    const [outer, ...holes] = rings.map((ring) => roundRing(ring, digits))
    if (!outer) return []
    return [[outer, ...holes.filter((ring): ring is Ring => ring != null)]]
  })

  return polygons.length > 0 ? geometryOf(polygons) : null
}

/** Keeps the largest parts that fit, largest first. Small islands are what goes. */
function keepLargestParts(geometry: AreaGeometry, budget: number): AreaGeometry | null {
  const byArea = polygonsOf(geometry)
    .map((coordinates) => ({ coordinates, area: polygonArea(coordinates) }))
    .toSorted((a, b) => b.area - a.area)

  const kept: PolygonCoords[] = []
  for (const { coordinates } of byArea) {
    if (encodedGeometryLength(geometryOf([...kept, coordinates])) <= budget) kept.push(coordinates)
  }
  return kept.length > 0 ? geometryOf(kept) : null
}

/** Bounding box polygon, rounded outward to 4 decimals so it still covers the geometry. */
function boundingBoxGeometry(geometry: AreaGeometry): GeoJSON.Polygon {
  const [west, south, east, north] = bbox(geometry)
  const down = (value: number) => Math.floor(value * 1e4) / 1e4
  const up = (value: number) => Math.ceil(value * 1e4) / 1e4
  const [w, s, e, n] = [down(west), down(south), up(east), up(north)]
  return {
    type: 'Polygon',
    coordinates: [
      [
        [w, s],
        [e, s],
        [e, n],
        [w, n],
        [w, s],
      ],
    ],
  }
}

/**
 * Makes a review area small enough for OSMCha's changeset list request.
 *
 * Each step simplifies more coarsely and rounds the coordinates to match. From the second
 * step on, holes are filled (that only widens the area). When the shape alone does not fit,
 * the smallest parts (islands) are left out. A result has to keep at least
 * `MIN_KEPT_AREA_SHARE` of the area; otherwise the bounding box is used, which covers everything.
 *
 * `startTolerance` is the first simplification in degrees; 0 tries the geometry as given first.
 */
export function fitGeometryToQuery(
  geometry: AreaGeometry,
  { startTolerance = 0, budget = GEOMETRY_QUERY_BUDGET } = {},
): FittedGeometry {
  if (startTolerance <= 0 && encodedGeometryLength(geometry) <= budget) {
    return { geometry, fit: 'exact' }
  }

  const minArea = area(geometry) * MIN_KEPT_AREA_SHARE
  // Drawn areas start just above "as given": rounding alone is often enough.
  let tolerance = startTolerance > 0 ? startTolerance : 0.0001
  // Each step simplifies the previous step's result: much faster on a detailed country.
  let simplified = geometry
  for (let index = 0; index < MAX_STEPS; index++, tolerance *= 2) {
    simplified = simplify(simplified, { tolerance, highQuality: true })
    const reduced = roundGeometry(simplified, digitsFor(tolerance), index >= 1)
    if (!reduced) continue
    const reducedArea = area(reduced)
    // Coarser steps only lose more.
    if (reducedArea < minArea) break

    if (encodedGeometryLength(reduced) <= budget) {
      return { geometry: reduced, fit: index === 0 && startTolerance > 0 ? 'exact' : 'simplified' }
    }
    const largest = keepLargestParts(reduced, budget)
    if (largest && area(largest) >= minArea) return { geometry: largest, fit: 'simplified' }
  }

  return { geometry: boundingBoxGeometry(geometry), fit: 'bbox' }
}
