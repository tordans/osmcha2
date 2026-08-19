import { describe, expect, test } from 'vitest'
import { getFeatureIdsForElement } from './changesetFeatureState.ts'
import { rotateOverlappingFeatures } from './changesetMapClick.ts'

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
