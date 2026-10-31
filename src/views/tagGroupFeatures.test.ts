import { describe, expect, test } from 'vitest'
import { changesetFeatureIndex, memberShapes, obstacleShapes } from './tagGroupFeatures.ts'
import { groupOutlineOnce, groupOutlineOnMap } from './tagGroupOutlineGeo.ts'

function feature(
  type: string,
  id: number,
  geometry: GeoJSON.Geometry,
  extra: Record<string, unknown> = {},
) {
  return {
    type: 'Feature' as const,
    properties: { type, id, action: 'modify', ...extra },
    geometry,
  }
}

const geojson = {
  type: 'FeatureCollection' as const,
  features: [
    feature('node', 1, { type: 'Point', coordinates: [0, 0] }),
    feature('node', 1, { type: 'Point', coordinates: [0.001, 0] }, { action: 'create' }),
    feature('way', 2, {
      type: 'LineString',
      coordinates: [
        [0, 0],
        [0.002, 0],
      ],
    }),
    feature('node', 3, { type: 'Point', coordinates: [0.001, 0] }, { clickable: false }),
    feature(
      'way',
      4,
      {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [0.001, 0],
            [0.001, 0.001],
            [0, 0],
          ],
        ],
      },
      { action: 'noop' },
    ),
    feature('relation', 5, {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 0],
        ],
      ],
    }),
    feature('node', 6, { type: 'Point', coordinates: [10, 10] }),
    { type: 'Feature' as const, properties: { type: 'node', id: 7 }, geometry: null },
  ],
}

const everywhere = { west: -1, south: -1, east: 1, north: 1 }

describe('changesetFeatureIndex', () => {
  test('the same GeoJSON is indexed once', () => {
    expect(changesetFeatureIndex(geojson)).toBe(changesetFeatureIndex(geojson))
  })

  test('members are every shape of the element, old and new side alike', () => {
    const index = changesetFeatureIndex(geojson)

    expect(memberShapes(index, ['node/1']).map((item) => item.shape)).toEqual([
      { kind: 'point', at: [0, 0] },
      { kind: 'point', at: [0.001, 0] },
    ])
    expect(memberShapes(index, ['node/404'])).toEqual([])
  })

  test('obstacles are other visible elements near the box, never vertices or relations', () => {
    const index = changesetFeatureIndex(geojson)
    const keys = obstacleShapes(index, everywhere, {
      exclude: new Set(['node/1']),
    }).map((item) => item.key)

    expect(keys).toEqual(['way/2', 'way/4'])
  })

  test('an element far from the box is no obstacle', () => {
    const index = changesetFeatureIndex(geojson)
    const keys = obstacleShapes(
      index,
      { west: 9, south: 9, east: 11, north: 11 },
      { exclude: new Set() },
    ).map((item) => item.key)

    expect(keys).toEqual(['node/6'])
  })
})

describe('groupOutlineOnMap', () => {
  test('draws the band around the members as lng/lat', () => {
    const outline = groupOutlineOnMap({ geojson, memberKeys: ['node/1'] })

    expect(outline).not.toBeNull()
    expect(outline!.zoom).toBe(18.5)
    const ring = outline!.polygon.geometry.coordinates[0]!
    const lngs = ring.map(([lng]) => lng!)
    // Members at lng 0 and 0.001, so the band spans them.
    expect(Math.min(...lngs)).toBeLessThan(0)
    expect(Math.max(...lngs)).toBeGreaterThan(0.001)
    expect(ring.at(-1)).toEqual(ring[0])
  })

  test('an element that is not in the changeset has no band', () => {
    expect(groupOutlineOnMap({ geojson, memberKeys: ['node/404'] })).toBeNull()
  })
})

describe('groupOutlineOnce', () => {
  const group = { code: 'A1', memberKeys: ['node/1'] }

  test('computes a group once per changeset, also when map layers rebuild the GeoJSON', async () => {
    const actions: unknown[] = []
    const first = groupOutlineOnce({ adiff: { actions }, geojson }, group)

    expect(groupOutlineOnce({ adiff: { actions }, geojson: { ...geojson } }, group)).toBe(first)
    expect((await first)?.polygon.type).toBe('Feature')
  })

  test('another group or another changeset gets its own', () => {
    const adiff = { actions: [] }
    const first = groupOutlineOnce({ adiff, geojson }, group)

    expect(groupOutlineOnce({ adiff, geojson }, { ...group, code: 'A2' })).not.toBe(first)
    expect(groupOutlineOnce({ adiff: { actions: [] }, geojson }, group)).not.toBe(first)
  })
})
