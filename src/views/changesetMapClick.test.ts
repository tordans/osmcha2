import type { Map, Point } from 'maplibre-gl'
import { describe, expect, test } from 'vitest'
import type { AdiffAction } from '../components/changeset/changesetElements.ts'
import { getFeatureIdsForElement } from './changesetFeatureState.ts'
import { pickChangesetActionFromClick, rotateOverlappingFeatures } from './changesetMapClick.ts'

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
