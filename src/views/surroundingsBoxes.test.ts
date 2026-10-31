import { describe, expect, test } from 'vitest'
import {
  boxAreaKm2,
  boxesFor,
  boxKey,
  boxLabelPoints,
  boxOutlines,
  isSurroundingsArea,
  missingPoints,
  oldestTimestampInView,
  parseSurroundingsTags,
  pointsByElement,
  type ChangePoint,
  type MapView,
} from './surroundingsBoxes.ts'
import { changesetFeatureIndex } from './tagGroupFeatures.ts'

const AT = 1_000
function viewAround(lng: number, lat: number, span = 0.01): MapView {
  return {
    box: { west: lng - span, east: lng + span, south: lat - span, north: lat + span },
    center: [lng, lat],
    at: AT,
  }
}

function index(...features: Array<{ id: number; type: string; coordinates: unknown }>) {
  return changesetFeatureIndex({
    features: features.map(({ id, type, coordinates }) => ({
      geometry: { type, coordinates },
      properties: { type: type === 'Point' ? 'node' : 'way', id },
    })),
  })
}

describe('boxesFor', () => {
  test('hugs its changes: a few nearby ones need far less than the limit', () => {
    const points: ChangePoint[] = [
      [13.4353, 52.4919],
      [13.4356, 52.4921],
    ]
    const boxes = boxesFor(points, 6)
    expect(boxes).toHaveLength(1)
    expect(boxAreaKm2(boxes[0]!)).toBeLessThan(0.05)
  })

  test('never goes over the limit: far-apart changes get their own boxes', () => {
    const points: ChangePoint[] = [
      [13.4, 52.5],
      [13.5, 52.5],
    ]
    const boxes = boxesFor(points, 6)
    expect(boxes).toHaveLength(2)
    for (const box of boxes) expect(boxAreaKm2(box)).toBeLessThanOrEqual(0.25)
  })

  test('a long line is split, every box within the limit', () => {
    const byElement = pointsByElement(
      index({
        id: 1,
        type: 'LineString',
        coordinates: [
          [13.4, 52.5],
          [13.5, 52.5],
        ],
      }),
      ['way/1'],
    )
    const points = byElement.get('way/1')!
    expect(points.length).toBeGreaterThan(100)
    const boxes = boxesFor(points, 100)
    expect(boxes.length).toBeGreaterThan(1)
    for (const box of boxes) expect(boxAreaKm2(box)).toBeLessThanOrEqual(0.25)
    expect(Math.max(...boxes.map((box) => box.east))).toBeGreaterThan(13.5)
  })

  test('stops at the number of boxes it is asked for', () => {
    const points = Array.from({ length: 10 }, (_, index): ChangePoint => [13 + index * 0.1, 52.5])
    expect(boxesFor(points, 3)).toHaveLength(3)
  })

  test('the same points give the same box, so the same request', () => {
    const points: ChangePoint[] = [[13.4353, 52.4919]]
    expect(boxKey(boxesFor(points, 1)[0]!)).toBe(boxKey(boxesFor(points, 1)[0]!))
  })
})

describe('missingPoints', () => {
  const byElement = new Map<string, ChangePoint[]>([
    ['node/1', [[13.4, 52.5]]],
    ['node/2', [[13.402, 52.5]]],
    ['node/3', [[14.5, 53]]],
  ])

  test('asks only for changes in view', () => {
    const missing = missingPoints({
      byElement,
      focusKeys: [],
      view: viewAround(13.4, 52.5),
      loaded: [],
    })
    expect(missing).toEqual([
      [13.4, 52.5],
      [13.402, 52.5],
    ])
  })

  test('nothing is missing once a box covers them, so the button rests', () => {
    const view = viewAround(13.4, 52.5)
    const loaded = boxesFor(missingPoints({ byElement, focusKeys: [], view, loaded: [] }), 6)
    expect(missingPoints({ byElement, focusKeys: [], view, loaded })).toEqual([])
  })

  test('moving to other changes asks again', () => {
    const near = viewAround(13.4, 52.5)
    const loaded = boxesFor(missingPoints({ byElement, focusKeys: [], view: near, loaded: [] }), 6)
    const far = viewAround(14.5, 53)
    expect(missingPoints({ byElement, focusKeys: [], view: far, loaded })).toEqual([[14.5, 53]])
  })

  test('the focused group comes first, then the centre of the view', () => {
    const view = viewAround(13.4, 52.5, 0.05)
    expect(missingPoints({ byElement, focusKeys: [], view, loaded: [] })[0]).toEqual([13.4, 52.5])
    expect(missingPoints({ byElement, focusKeys: ['node/2'], view, loaded: [] })[0]).toEqual([
      13.402, 52.5,
    ])
  })
})

describe('the frame', () => {
  const box = { west: 1, south: 2, east: 3, north: 4 }

  test('each box is a closed outline with its label on the top edge', () => {
    const [outline] = boxOutlines([box])
    expect(outline).toHaveLength(5)
    expect(outline![0]).toEqual(outline![4])
    expect(boxLabelPoints([box])).toEqual([[2, 4]])
  })

  test('the label names the oldest data in view', () => {
    const view = viewAround(13.4, 52.5)
    const near = { west: 13.4, south: 52.5, east: 13.401, north: 52.501 }
    expect(
      oldestTimestampInView(
        [
          { ...near, timestamp: '2026-10-31T05:00:00Z' },
          { ...near, timestamp: '2026-10-31T04:00:00Z' },
          { ...box, timestamp: '2020-01-01T00:00:00Z' },
        ],
        view,
      ),
    ).toBe('2026-10-31T04:00:00Z')
    expect(oldestTimestampInView([{ ...box, timestamp: 't' }], view)).toBeNull()
  })
})

describe('parseSurroundingsTags', () => {
  test('reads the stored JSON and drops what is not tags', () => {
    expect(parseSurroundingsTags('{"highway":"path"}')).toEqual([['highway', 'path']])
    expect(parseSurroundingsTags('not json')).toEqual([])
    expect(parseSurroundingsTags('{"a":1}')).toEqual([])
    expect(parseSurroundingsTags(undefined)).toEqual([])
  })
})

describe('isSurroundingsArea', () => {
  const way = { osmType: 'way', polygon: true, closed: true, tags: '{"highway":"pedestrian"}' }

  test('a way follows the preset rule once it is there', () => {
    expect(isSurroundingsArea(way, () => false)).toBe(false)
    expect(isSurroundingsArea({ ...way, polygon: false }, () => true)).toBe(true)
  })

  test('without the preset data, and for relations, the polygon decides', () => {
    expect(isSurroundingsArea(way, undefined)).toBe(true)
    expect(isSurroundingsArea({ ...way, osmType: 'relation' }, () => false)).toBe(true)
    expect(isSurroundingsArea({ osmType: 'node', polygon: false }, () => true)).toBe(false)
  })

  test('hands over the tags and whether the way is closed', () => {
    const seen: unknown[] = []
    isSurroundingsArea(way, (tags, closed) => {
      seen.push(tags, closed)
      return true
    })
    expect(seen).toEqual([{ highway: 'pedestrian' }, true])
  })
})
