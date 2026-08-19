import { describe, expect, test } from 'vitest'
import { changesetViewBounds } from './changesetViewBounds.ts'

function feature(
  type: 'node' | 'way' | 'relation',
  action: string,
  coordinates: GeoJSON.Position | GeoJSON.Position[][],
): GeoJSON.Feature {
  const geometry: GeoJSON.Geometry =
    type === 'node'
      ? { type: 'Point', coordinates: coordinates as GeoJSON.Position }
      : { type: 'Polygon', coordinates: coordinates as GeoJSON.Position[][] }

  return {
    type: 'Feature',
    properties: { type, action },
    geometry,
  }
}

describe('changesetViewBounds', () => {
  test('fits nodes and ways and ignores a worldwide relation envelope', () => {
    const bounds = changesetViewBounds([
      feature('node', 'modify', [13.44, 52.5]),
      feature('way', 'create', [
        [
          [13.44, 52.5],
          [13.45, 52.5],
          [13.45, 52.51],
          [13.44, 52.5],
        ],
      ]),
      feature('relation', 'modify', [
        [
          [-170, -80],
          [170, -80],
          [170, 80],
          [-170, 80],
          [-170, -80],
        ],
      ]),
    ])

    expect(bounds).not.toBeNull()
    const [west, south, east, north] = bounds!
    expect(west).toBeGreaterThan(13)
    expect(east).toBeLessThan(14)
    expect(south).toBeGreaterThan(52)
    expect(north).toBeLessThan(53)
  })

  test('falls back to the relation envelope when nothing else changed', () => {
    const bounds = changesetViewBounds([
      feature('relation', 'modify', [
        [
          [13.4, 52.4],
          [13.5, 52.4],
          [13.5, 52.5],
          [13.4, 52.4],
        ],
      ]),
      feature('node', 'noop', [0, 0]),
    ])

    expect(bounds).not.toBeNull()
    const [west, , east] = bounds!
    expect(west).toBeCloseTo(13.4)
    expect(east).toBeCloseTo(13.5)
  })

  test('returns null when there is no changed geometry', () => {
    expect(changesetViewBounds([feature('node', 'noop', [13.4, 52.5])])).toBeNull()
    expect(changesetViewBounds([])).toBeNull()
  })
})
