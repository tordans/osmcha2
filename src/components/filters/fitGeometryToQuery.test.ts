import area from '@turf/area'
import bbox from '@turf/bbox'
import { describe, expect, test } from 'vitest'
import {
  encodedGeometryLength,
  fitGeometryToQuery,
  GEOMETRY_QUERY_BUDGET,
} from './fitGeometryToQuery.ts'

/** A wobbly ring around a center, like a coastline: `points` positions, radius in degrees. */
function wobblyRing(cx: number, cy: number, radius: number, points: number): GeoJSON.Position[] {
  const ring: GeoJSON.Position[] = []
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 2 * Math.PI
    // Bays and capes at several scales, plus fine noise well below the place search's tolerance.
    const r =
      radius *
      (1 + 0.1 * Math.sin(5 * angle) + 0.05 * Math.sin(17 * angle) + 0.005 * Math.sin(i * 7.3))
    ring.push([cx + r * Math.cos(angle) * 1.3, cy + r * Math.sin(angle)])
  }
  ring.push([...ring[0]!])
  return ring
}

/** Roughly Ireland: a detailed main island and many small islands around it. */
function countryLike(): GeoJSON.MultiPolygon {
  const main = [wobblyRing(-8, 53.4, 1.8, 20000)]
  const islands = Array.from({ length: 300 }, (_, i) => {
    const angle = (i / 300) * 2 * Math.PI
    return [wobblyRing(-8 + 2.6 * Math.cos(angle), 53.4 + 2.1 * Math.sin(angle), 0.01, 40)]
  })
  return { type: 'MultiPolygon', coordinates: [main, ...islands] }
}

function inRing([x, y]: GeoJSON.Position, ring: GeoJSON.Position[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!
    const [xj, yj] = ring[j]!
    if (yi! > y! !== yj! > y! && x! < ((xj! - xi!) * (y! - yi!)) / (yj! - yi!) + xi!)
      inside = !inside
  }
  return inside
}

/** Inside an outer ring and outside its holes. */
function covers(geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon, position: GeoJSON.Position) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  return polygons.some(
    ([outer, ...holes]) =>
      inRing(position, outer!) && !holes.some((hole) => inRing(position, hole)),
  )
}

const square: GeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [13.3, 52.4],
      [13.5, 52.4],
      [13.5, 52.6],
      [13.3, 52.6],
      [13.3, 52.4],
    ],
  ],
}

describe('fitGeometryToQuery', () => {
  test('keeps a small drawn area as given', () => {
    expect(fitGeometryToQuery(square)).toEqual({ geometry: square, fit: 'exact' })
  })

  test('fits a detailed country into the budget and keeps its shape', () => {
    const country = countryLike()
    expect(encodedGeometryLength(country)).toBeGreaterThan(100_000)

    const { geometry, fit } = fitGeometryToQuery(country, { startTolerance: 0.1 })
    expect(encodedGeometryLength(geometry)).toBeLessThanOrEqual(GEOMETRY_QUERY_BUDGET)
    expect(fit).not.toBe('bbox')
    expect(covers(geometry, [-8, 53.4])).toBe(true)
    const ratio = area(geometry) / area(country)
    expect(ratio).toBeGreaterThan(0.9)
    expect(ratio).toBeLessThan(1.1)
  })

  test('rounds coordinates', () => {
    const { geometry } = fitGeometryToQuery(countryLike(), { startTolerance: 0.1 })
    const text = JSON.stringify(geometry)
    expect(text).not.toMatch(/\.\d{5,}/)
  })

  test('fills holes before giving up detail elsewhere', () => {
    const outer = wobblyRing(10, 50, 1, 4000)
    const hole = wobblyRing(10, 50, 0.3, 4000).reverse()
    const { geometry } = fitGeometryToQuery(
      { type: 'Polygon', coordinates: [outer, hole] },
      { startTolerance: 0.01, budget: 1500 },
    )
    expect(geometry.type).toBe('Polygon')
    expect(geometry.coordinates).toHaveLength(1)
    expect(covers(geometry, [10, 50])).toBe(true)
  })

  test('falls back to the bounding box, which covers the whole area', () => {
    const country = countryLike()
    const { geometry, fit } = fitGeometryToQuery(country, { budget: 200 })
    expect(fit).toBe('bbox')
    expect(encodedGeometryLength(geometry)).toBeLessThanOrEqual(200)
    const [west, south, east, north] = bbox(country)
    const [w, s, e, n] = bbox(geometry)
    expect(w).toBeLessThanOrEqual(west)
    expect(s).toBeLessThanOrEqual(south)
    expect(e).toBeGreaterThanOrEqual(east)
    expect(n).toBeGreaterThanOrEqual(north)
  })
})
