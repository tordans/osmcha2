import { describe, expect, test } from 'vitest'
import {
  areaLtBoundPolygon,
  bboxOfGeometry,
  parseAreaLt,
  planarAreaDegree2,
} from './areaLtBound.ts'

function boxPolygon(west: number, south: number, east: number, north: number): GeoJSON.Polygon {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [west, south],
        [east, south],
        [east, north],
        [west, north],
        [west, south],
      ],
    ],
  }
}

describe('planarAreaDegree2', () => {
  test('returns width×height for an axis-aligned box', () => {
    expect(planarAreaDegree2(boxPolygon(0, 0, 1, 1))).toBeCloseTo(1)
    expect(planarAreaDegree2(boxPolygon(0, 0, 2, 2))).toBeCloseTo(4)
  })

  test('subtracts holes and sums MultiPolygon parts', () => {
    const withHole: GeoJSON.Polygon = {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [4, 0],
          [4, 4],
          [0, 4],
          [0, 0],
        ],
        [
          [1, 1],
          [2, 1],
          [2, 2],
          [1, 2],
          [1, 1],
        ],
      ],
    }
    expect(planarAreaDegree2(withHole)).toBeCloseTo(15)

    const multi: GeoJSON.MultiPolygon = {
      type: 'MultiPolygon',
      coordinates: [boxPolygon(0, 0, 1, 1).coordinates, boxPolygon(10, 10, 11, 12).coordinates],
    }
    expect(planarAreaDegree2(multi)).toBeCloseTo(3)
  })
})

describe('areaLtBoundPolygon', () => {
  test('scales a box by sqrt(N) from its center (N=4 → 2× width/height)', () => {
    const geometry = boxPolygon(0, 0, 2, 1)
    const overlay = areaLtBoundPolygon(geometry, 4)
    expect(overlay).not.toBeNull()

    const bounds = bboxOfGeometry(overlay!)
    expect(bounds).toEqual([-1, -0.5, 3, 1.5])
    expect(planarAreaDegree2(overlay!)).toBeCloseTo(4 * planarAreaDegree2(geometry))
  })

  test('uses polygon area (not bbox area) for the overlay size', () => {
    // Right triangle with legs 2 — area 2, bbox area 4
    const triangle: GeoJSON.Polygon = {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [2, 0],
          [0, 2],
          [0, 0],
        ],
      ],
    }
    expect(planarAreaDegree2(triangle)).toBeCloseTo(2)

    const overlay = areaLtBoundPolygon(triangle, 3)
    expect(overlay).not.toBeNull()
    expect(planarAreaDegree2(overlay!)).toBeCloseTo(6)

    const bounds = bboxOfGeometry(overlay!)!
    const width = bounds[2] - bounds[0]
    const height = bounds[3] - bounds[1]
    // Same aspect ratio as the triangle's bbox (2×2 → 1:1)
    expect(width / height).toBeCloseTo(1)
  })

  test('returns null when area_lt is missing/invalid or geometry has no area', () => {
    expect(areaLtBoundPolygon(boxPolygon(0, 0, 1, 1), 0)).toBeNull()
    expect(areaLtBoundPolygon(boxPolygon(0, 0, 1, 1), -2)).toBeNull()
    expect(areaLtBoundPolygon(boxPolygon(0, 0, 1, 1), Number.NaN)).toBeNull()
    expect(
      areaLtBoundPolygon(
        {
          type: 'Point',
          coordinates: [0, 0],
        },
        2,
      ),
    ).toBeNull()
  })
})

describe('parseAreaLt', () => {
  test('parses positive numbers and rejects empty/invalid values', () => {
    expect(parseAreaLt(2)).toBe(2)
    expect(parseAreaLt('2')).toBe(2)
    expect(parseAreaLt('')).toBeNull()
    expect(parseAreaLt(null)).toBeNull()
    expect(parseAreaLt(0)).toBeNull()
    expect(parseAreaLt(-1)).toBeNull()
    expect(parseAreaLt('nope')).toBeNull()
  })
})
