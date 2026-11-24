import { describe, expect, test } from 'vitest'
import { placeGeometry } from './placeGeometry.ts'

describe('placeGeometry', () => {
  test('keeps a polygon', () => {
    const polygon = {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 0],
        ],
      ],
    }
    expect(placeGeometry({ display_name: 'x', geojson: polygon })).toBe(polygon)
  })

  test('uses the bounding box for a point', () => {
    const geometry = placeGeometry({
      display_name: 'Alexanderplatz',
      geojson: { type: 'Point', coordinates: [13.41, 52.52] },
      boundingbox: ['52.51', '52.53', '13.40', '13.42'],
    })
    expect(geometry?.type).toBe('Polygon')
    expect(geometry?.coordinates[0]).toContainEqual([13.4, 52.51])
    expect(geometry?.coordinates[0]).toContainEqual([13.42, 52.53])
  })

  test('returns null without geometry or a usable bounding box', () => {
    expect(placeGeometry({ display_name: 'x' })).toBeNull()
    expect(placeGeometry({ display_name: 'x', boundingbox: ['1', '1', '2', '2'] })).toBeNull()
  })
})
