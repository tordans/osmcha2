import { describe, expect, test } from 'vitest'
import type { AdiffAction } from './changesetElements.ts'
import { adiffOverlap, changesetBboxOverlap, reviewAreaFromFilters } from './reviewArea.ts'

/** Roughly Berlin. */
const berlinBox = '13.0,52.3,13.8,52.7'
const berlinTriangle = {
  type: 'Polygon',
  coordinates: [
    [
      [13.0, 52.3],
      [13.8, 52.3],
      [13.0, 52.7],
      [13.0, 52.3],
    ],
  ],
}

function bboxGeometry(west: number, south: number, east: number, north: number) {
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

function node(id: number, lon: number, lat: number, type = 'create'): AdiffAction {
  return { type, new: { type: 'node', id, version: 1, lon, lat } }
}

function way(id: number, points: Array<[number, number]>): AdiffAction {
  return {
    type: 'create',
    new: {
      type: 'way',
      id,
      version: 1,
      nodes: points.map(([lon, lat], index) => ({ ref: index + 1, lon, lat })),
    },
  }
}

describe('reviewAreaFromFilters', () => {
  test('reads in_bbox from URL filters, split or whole', () => {
    const whole = reviewAreaFromFilters({ in_bbox: [{ label: berlinBox, value: berlinBox }] })
    const split = reviewAreaFromFilters({
      in_bbox: berlinBox.split(',').map((value) => ({ label: value, value })),
    })
    expect(whole?.kind).toBe('box')
    expect(whole?.bbox).toEqual([13.0, 52.3, 13.8, 52.7])
    expect(split?.key).toBe(whole?.key)
  })

  test('reads a saved filter geometry given as JSON text, and prefers it over in_bbox', () => {
    const area = reviewAreaFromFilters({
      geometry: JSON.stringify(berlinTriangle),
      in_bbox: '0,0,1,1',
    })
    expect(area?.kind).toBe('shape')
    expect(area?.bbox).toEqual([13.0, 52.3, 13.8, 52.7])
  })

  test('is null without a location filter or with a broken one', () => {
    expect(reviewAreaFromFilters({})).toBeNull()
    expect(reviewAreaFromFilters({ in_bbox: '1,2,3' })).toBeNull()
    expect(reviewAreaFromFilters({ geometry: 'nope' })).toBeNull()
  })
})

describe('adiffOverlap', () => {
  const box = reviewAreaFromFilters({ in_bbox: berlinBox })!
  const triangle = reviewAreaFromFilters({ geometry: berlinTriangle })!

  test('Paris and Helsinki edits do not meet Berlin, though their bbox does', () => {
    const actions = [node(1, 2.35, 48.85), node(2, 24.9, 60.2)]
    expect(changesetBboxOverlap(bboxGeometry(2.35, 48.85, 24.9, 60.2), box)).toBeNull()
    expect(adiffOverlap(actions, box)).toBe('outside')
  })

  test('one edit in the area is enough', () => {
    expect(adiffOverlap([node(1, 2.35, 48.85), node(2, 13.4, 52.5)], box)).toBe('inside')
  })

  test('uses the exact shape, not its bbox', () => {
    // Inside the triangle's bbox, beyond its diagonal.
    expect(adiffOverlap([node(1, 13.7, 52.65)], triangle)).toBe('outside')
    expect(adiffOverlap([node(1, 13.1, 52.35)], triangle)).toBe('inside')
  })

  test('a way that crosses the area without a node inside counts', () => {
    const crossing = way(1, [
      [12.0, 52.5],
      [15.0, 52.5],
    ])
    expect(adiffOverlap([crossing], box)).toBe('inside')
  })

  test('a closed way around the whole area counts', () => {
    const ring = way(1, [
      [10, 50],
      [16, 50],
      [16, 55],
      [10, 55],
      [10, 50],
    ])
    expect(adiffOverlap([ring], box)).toBe('inside')
  })

  test('the old side of a moved node counts', () => {
    const moved: AdiffAction = {
      type: 'modify',
      old: { type: 'node', id: 1, version: 1, lon: 13.4, lat: 52.5 },
      new: { type: 'node', id: 1, version: 2, lon: 2.35, lat: 48.85 },
    }
    expect(adiffOverlap([moved], box)).toBe('inside')
  })

  test('unchanged context does not count', () => {
    const context: AdiffAction = {
      type: 'noop',
      new: { type: 'node', id: 1, version: 1, lon: 13.4, lat: 52.5 },
    }
    expect(adiffOverlap([context, node(2, 2.35, 48.85)], box)).toBe('outside')
  })

  test('relations count by their members', () => {
    const relation: AdiffAction = {
      type: 'modify',
      old: { type: 'relation', id: 1, version: 1, members: [] },
      new: {
        type: 'relation',
        id: 1,
        version: 2,
        members: [
          {
            type: 'way',
            ref: 5,
            nodes: [
              { lon: 13.3, lat: 52.5 },
              { lon: 13.4, lat: 52.5 },
            ],
          },
        ],
      },
    }
    expect(adiffOverlap([relation], box)).toBe('inside')
  })

  test('is null without any geometry', () => {
    expect(adiffOverlap([], box)).toBeNull()
  })
})

describe('changesetBboxOverlap', () => {
  const box = reviewAreaFromFilters({ in_bbox: berlinBox })!
  const triangle = reviewAreaFromFilters({ geometry: berlinTriangle })!

  test('a bbox wholly inside the area is inside without the edits', () => {
    expect(changesetBboxOverlap(bboxGeometry(13.3, 52.4, 13.5, 52.6), box)).toBe('inside')
  })

  test('a bbox reaching past the area needs the edits', () => {
    expect(changesetBboxOverlap(bboxGeometry(13.5, 52.4, 14.5, 52.6), box)).toBeNull()
  })

  test('a bbox inside the shape bbox but across its edge needs the edits', () => {
    expect(changesetBboxOverlap(bboxGeometry(13.1, 52.35, 13.7, 52.65), triangle)).toBeNull()
  })

  test('a single-node changeset is decided by its point', () => {
    expect(changesetBboxOverlap(bboxGeometry(13.4, 52.5, 13.4, 52.5), box)).toBe('inside')
  })
})
