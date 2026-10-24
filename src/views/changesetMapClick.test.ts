import type { Map, Point } from 'maplibre-gl'
import { describe, expect, test } from 'vitest'
import type { AdiffAction } from '../components/changeset/changesetElements.ts'
import { getFeatureIdsForElement } from './changesetFeatureState.ts'
import {
  hitKindRank,
  hitSlopPx,
  isTouchInput,
  pickChangesetActionFromClick,
  rotateOverlappingFeatures,
} from './changesetMapClick.ts'

describe('rotateOverlappingFeatures', () => {
  test('returns null when nothing is under the cursor', () => {
    expect(rotateOverlappingFeatures([], null)).toBeNull()
  })

  test('dedupes by feature id and rotates on successive clicks', () => {
    const features = [
      { id: 2, properties: { type: 'way', id: 20 } },
      { id: 2, properties: { type: 'way', id: 20 } },
      { id: 1, properties: { type: 'node', id: 10 } },
    ]

    const first = rotateOverlappingFeatures(features, null)
    expect(first?.nextId).toBe(1)

    const second = rotateOverlappingFeatures(features, first!.nextId)
    expect(second?.nextId).toBe(2)

    const third = rotateOverlappingFeatures(features, second!.nextId)
    expect(third?.nextId).toBe(1)
  })
})

describe('overlap priority', () => {
  const area = { id: 1, geometry: { type: 'Polygon' }, properties: { type: 'way', id: 100 } }
  const line = { id: 5, geometry: { type: 'LineString' }, properties: { type: 'way', id: 101 } }
  const point = { id: 9, geometry: { type: 'Point' }, properties: { type: 'node', id: 102 } }
  const relation = {
    id: 0,
    geometry: { type: 'Polygon' },
    properties: { type: 'relation', id: 103 },
  }

  test('ranks points before lines before areas before relations', () => {
    expect([point, line, area, relation].map(hitKindRank)).toEqual([0, 1, 2, 3])
  })

  test('falls back to the OSM type without geometry', () => {
    expect(hitKindRank({ properties: { type: 'node' } })).toBe(0)
    expect(hitKindRank({ properties: { type: 'way' } })).toBe(1)
  })

  test('cycles point, line, area, relation regardless of id; ties by id', () => {
    const features = [relation, area, line, point]
    const order: Array<string | number> = []
    let previous: string | number | null = null
    for (let i = 0; i < 5; i++) {
      const next: { nextId: string | number } = rotateOverlappingFeatures(features, previous)!
      order.push(next.nextId)
      previous = next.nextId
    }
    expect(order).toEqual([9, 5, 1, 0, 9])

    const twoLines = [
      { id: 8, geometry: { type: 'LineString' }, properties: { type: 'way', id: 1 } },
      { id: 3, geometry: { type: 'LineString' }, properties: { type: 'way', id: 2 } },
    ]
    expect(rotateOverlappingFeatures(twoLines, null)?.nextId).toBe(3)
  })
})

describe('hit slop', () => {
  test('is larger for touch than for mouse', () => {
    expect(hitSlopPx(false)).toBe(5)
    expect(hitSlopPx(true)).toBe(12)
  })

  test('detects touch from pointer and touch events', () => {
    expect(isTouchInput({ pointerType: 'touch' }, false)).toBe(true)
    expect(isTouchInput({ pointerType: 'pen' }, false)).toBe(true)
    expect(isTouchInput({ pointerType: 'mouse' }, true)).toBe(false)
    expect(isTouchInput({ type: 'touchend' }, false)).toBe(true)
  })

  test('without a hint, follows the primary pointer', () => {
    expect(isTouchInput({ type: 'click' }, true)).toBe(true)
    expect(isTouchInput({ type: 'click' }, false)).toBe(false)
    expect(isTouchInput(undefined, false)).toBe(false)
  })

  test('queries a box of the requested size around the tap', () => {
    const boxes: unknown[] = []
    const map = {
      getLayer: () => ({}),
      queryRenderedFeatures: (box: unknown) => {
        boxes.push(box)
        return []
      },
    } as unknown as Map
    const base = {
      map,
      point: { x: 100, y: 50 } as Point,
      interactiveLayerIds: ['changeset-way-new'],
      actions: [],
      previousFeatureId: null,
    }
    pickChangesetActionFromClick(base)
    pickChangesetActionFromClick({ ...base, hitSlop: hitSlopPx(true) })
    expect(boxes).toEqual([
      [
        [95, 45],
        [105, 55],
      ],
      [
        [88, 38],
        [112, 62],
      ],
    ])
  })
})

describe('getFeatureIdsForElement', () => {
  test('returns numeric GeoJSON feature ids for an OSM element', () => {
    const geojson = {
      features: [
        { id: 0, properties: { type: 'way', id: 10 } },
        { id: 0, properties: { type: 'way', id: 10 } },
        { id: 1, properties: { type: 'node', id: 11 } },
      ],
    }

    expect(getFeatureIdsForElement(geojson, 'way', 10)).toEqual([0, 0])
    expect(getFeatureIdsForElement(geojson, 'node', 11)).toEqual([1])
    expect(getFeatureIdsForElement(geojson, 'relation', 11)).toEqual([])
  })
})

describe('pickChangesetActionFromClick', () => {
  const point = { x: 10, y: 10 } as Point

  function stubMap(
    features: Array<{ id?: number; layer?: { id: string }; properties?: object | null }>,
  ): Map {
    return {
      getLayer: () => ({}),
      queryRenderedFeatures: () => features,
    } as unknown as Map
  }

  test('ignores halo hits whose action is noop', () => {
    const create: AdiffAction = { type: 'create', new: { type: 'way', id: 20 } }
    const result = pickChangesetActionFromClick({
      map: stubMap([
        {
          id: 1,
          layer: { id: 'changeset-way-bg' },
          properties: { action: 'noop', type: 'way', id: 9 },
        },
      ]),
      point,
      interactiveLayerIds: ['changeset-way-bg'],
      actions: [{ type: 'noop', new: { type: 'way', id: 9 } }, create],
      previousFeatureId: null,
    })
    expect(result).toEqual({ action: null, nextFeatureId: null })
  })

  test('still picks create/modify/delete from a halo layer', () => {
    const create: AdiffAction = { type: 'create', new: { type: 'way', id: 20 } }
    const result = pickChangesetActionFromClick({
      map: stubMap([
        {
          id: 3,
          layer: { id: 'changeset-way-bg' },
          properties: { action: 'create', type: 'way', id: 20 },
        },
      ]),
      point,
      interactiveLayerIds: ['changeset-way-bg'],
      actions: [create],
      previousFeatureId: null,
    })
    expect(result.action).toBe(create)
    expect(result.nextFeatureId).toBe(3)
  })

  test('picks a same-version way whose member coordinates changed', () => {
    const way: AdiffAction = {
      type: 'modify',
      old: {
        type: 'way',
        id: 10,
        version: 5,
        nodes: [{ ref: 1, lon: 10, lat: 48 }],
        tags: { building: 'yes' },
      },
      new: {
        type: 'way',
        id: 10,
        version: 5,
        nodes: [{ ref: 1, lon: 10.001, lat: 48 }],
        tags: { building: 'yes' },
      },
    }
    const result = pickChangesetActionFromClick({
      map: stubMap([
        {
          id: 7,
          layer: { id: 'changeset-way-new' },
          properties: { action: 'modify', type: 'way', id: 10 },
        },
      ]),
      point,
      interactiveLayerIds: ['changeset-way-new'],
      actions: [way],
      previousFeatureId: null,
    })
    expect(result.action).toBe(way)
    expect(result.nextFeatureId).toBe(7)
  })

  test('skips features hidden by the review filter', () => {
    const create: AdiffAction = { type: 'create', new: { type: 'way', id: 20 } }
    const result = pickChangesetActionFromClick({
      map: stubMap([
        {
          id: 3,
          layer: { id: 'changeset-way-new' },
          properties: { action: 'create', type: 'way', id: 20 },
        },
      ]),
      point,
      interactiveLayerIds: ['changeset-way-new'],
      actions: [create],
      previousFeatureId: null,
      isFeatureVisible: () => false,
    })
    expect(result).toEqual({ action: null, nextFeatureId: null })
  })
})
