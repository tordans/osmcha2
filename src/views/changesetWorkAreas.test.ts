import { describe, expect, test } from 'vitest'
import { activeWorkArea, changesetWorkAreas, workAreaOutlines } from './changesetWorkAreas.ts'

function node(id: number, lng: number, lat: number, action = 'create'): GeoJSON.Feature {
  return {
    type: 'Feature',
    properties: { type: 'node', id, action, side: 'new' },
    geometry: { type: 'Point', coordinates: [lng, lat] },
  }
}

function relation(id: number, bounds: [number, number, number, number]): GeoJSON.Feature {
  const [west, south, east, north] = bounds
  return {
    type: 'Feature',
    properties: { type: 'relation', id, action: 'modify', side: 'new' },
    geometry: {
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
    },
  }
}

// Changeset 190223077: two shops in Delft and one apartment in Huizhou.
const delftAndHuizhou = [
  node(2599516117, 4.3585256, 52.0104676, 'modify'),
  node(14266031101, 4.3587872, 52.0110087),
  node(14266031102, 114.4183508, 22.7589232),
]

describe('changesetWorkAreas', () => {
  test('splits edits on two continents and puts the busier area first', () => {
    const areas = changesetWorkAreas(delftAndHuizhou)

    expect(areas.map((area) => [area.id, [...area.elementKeys]])).toEqual([
      [1, ['node/2599516117', 'node/14266031101']],
      [2, ['node/14266031102']],
    ])
    expect(areas[0]!.bounds).toEqual([4.3585256, 52.0104676, 4.3587872, 52.0110087])
  })

  test('keeps edits within one town as a single area', () => {
    const areas = changesetWorkAreas([
      node(1, 13.4, 52.5),
      node(2, 13.41, 52.51),
      node(3, 13.43, 52.5),
    ])

    expect(areas).toHaveLength(1)
    expect(areas[0]!.elementKeys.size).toBe(3)
  })

  test('widens a single-node area so it can be fitted', () => {
    const [, huizhou] = changesetWorkAreas(delftAndHuizhou)
    const [west, south, east, north] = huizhou!.bounds

    expect(east).toBeGreaterThan(west)
    expect(north).toBeGreaterThan(south)
  })

  test('merges areas until at most eight remain', () => {
    const scattered = Array.from({ length: 30 }, (_, index) =>
      node(index, (index % 6) * 20 - 50, Math.floor(index / 6) * 20 - 40),
    )

    const areas = changesetWorkAreas(scattered)

    expect(areas.length).toBeLessThanOrEqual(8)
    expect(areas.reduce((sum, area) => sum + area.elementKeys.size, 0)).toBe(30)
  })

  test('keeps a busy cluster whole and joins only the edits within the gap', () => {
    // 900 nodes within ~1.5 km, a 1° jump to a second town, and a chain heading east
    // whose steps sit just under and just over the split gap (a tenth of the extent).
    const busy = Array.from({ length: 900 }, (_, index) =>
      node(index + 1, 13.4 + (index % 30) * 0.0005, 52.5 + Math.floor(index / 30) * 0.0005),
    )
    const chain = [
      node(1001, 13.4145 + 0.09, 52.5),
      node(1002, 13.4145 + 0.09 + 0.11, 52.5),
      node(1003, 13.4145 + 0.09 + 0.11 + 0.09, 52.5),
    ]
    const town = [node(2001, 14.4, 52.5), node(2002, 14.401, 52.501)]

    const areas = changesetWorkAreas([...town, ...chain, ...busy])

    expect(areas.map((area) => [area.id, area.elementKeys.size])).toEqual([
      [1, 901],
      [2, 2],
      [3, 2],
    ])
    expect(areas[0]!.elementKeys.has('node/1001')).toBe(true)
    expect([...areas[1]!.elementKeys]).toEqual(['node/1002', 'node/1003'])
  })

  test('assigns a relation to the area it touches without widening that area', () => {
    const areas = changesetWorkAreas([...delftAndHuizhou, relation(7, [4, 51, 6, 53])])

    expect(areas[0]!.elementKeys.has('relation/7')).toBe(true)
    expect(areas[0]!.bounds).toEqual([4.3585256, 52.0104676, 4.3587872, 52.0110087])
  })

  test('ignores unchanged context and returns nothing without edits', () => {
    expect(changesetWorkAreas([node(1, 13.4, 52.5, 'noop')])).toEqual([])
  })
})

describe('activeWorkArea', () => {
  const areas = changesetWorkAreas(delftAndHuizhou)

  test('names the one area in view', () => {
    expect(activeWorkArea(areas, [4.3, 52, 4.4, 52.1])).toBe(1)
    expect(activeWorkArea(areas, [114, 22, 115, 23])).toBe(2)
  })

  test('is all when every area is in view and null when none is', () => {
    expect(activeWorkArea(areas, [-10, 0, 130, 70])).toBe('all')
    expect(activeWorkArea(areas, [-80, -10, -70, 0])).toBeNull()
  })
})

describe('workAreaOutlines', () => {
  test('keeps a far-away area visible as a box when zoomed out', () => {
    const areas = changesetWorkAreas(delftAndHuizhou)
    const ring = workAreaOutlines(areas, 2).features[0]!.geometry.coordinates[0]!
    const widthDeg = ring[1]![0]! - ring[0]![0]!

    // 56 px at zoom 2 is 56 / (512 * 4) of the 360° world; the edits themselves add ~0.0003°.
    expect(widthDeg).toBeCloseTo((56 / 2048) * 360, 2)
  })

  test('hugs the edits with a small margin when zoomed in', () => {
    const areas = changesetWorkAreas(delftAndHuizhou)
    const ring = workAreaOutlines(areas, 18).features[0]!.geometry.coordinates[0]!

    expect(ring[0]![0]).toBeLessThan(4.3585256)
    expect(ring[0]![0]).toBeGreaterThan(4.358)
    expect(ring[1]![0]).toBeGreaterThan(4.3587872)
  })
})
