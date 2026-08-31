import type { Map } from 'maplibre-gl'
import { describe, expect, test } from 'vitest'
import {
  getFeatureIdsForElement,
  setSelectedFeatureState,
  syncHighlightedFeatureState,
  type ChangesetGeoJSON,
} from './changesetFeatureState.ts'

function createMapRecorder() {
  const calls: Array<{ id: string | number; state: object }> = []
  const map = {
    setFeatureState: (_ref: { id: string | number }, state: object) => {
      calls.push({ id: _ref.id, state })
    },
  } as unknown as Map
  return { map, calls }
}

describe('syncHighlightedFeatureState', () => {
  test('sets the active element without clearing unrelated features', () => {
    const geojson: ChangesetGeoJSON = {
      features: [
        { id: 1, properties: { type: 'way', id: 10 } },
        { id: 2, properties: { type: 'node', id: 11 } },
      ],
    }
    const { map, calls } = createMapRecorder()

    syncHighlightedFeatureState(map, geojson, { type: 'way', id: 10 })

    expect(calls).toEqual([{ id: 1, state: { highlighted: true } }])
    expect(getFeatureIdsForElement(geojson, 'way', 10)).toEqual([1])
  })

  test('clears only the previous highlight when hover moves', () => {
    const geojson: ChangesetGeoJSON = {
      features: [
        { id: 1, properties: { type: 'way', id: 10 } },
        { id: 2, properties: { type: 'node', id: 11 } },
      ],
    }
    const { map, calls } = createMapRecorder()

    syncHighlightedFeatureState(map, geojson, { type: 'way', id: 10 })
    calls.length = 0
    syncHighlightedFeatureState(map, geojson, { type: 'node', id: 11 })

    expect(calls).toEqual([
      { id: 1, state: { highlighted: false } },
      { id: 2, state: { highlighted: true } },
    ])
  })

  test('clears the previous highlight when hover is empty', () => {
    const geojson: ChangesetGeoJSON = {
      features: [{ id: 1, properties: { type: 'way', id: 10 } }],
    }
    const { map, calls } = createMapRecorder()

    syncHighlightedFeatureState(map, geojson, { type: 'way', id: 10 })
    calls.length = 0
    syncHighlightedFeatureState(map, geojson, null)
    expect(calls).toEqual([{ id: 1, state: { highlighted: false } }])
  })
})

describe('setSelectedFeatureState', () => {
  test('clears only the previous selection when selecting another element', () => {
    const geojson: ChangesetGeoJSON = {
      features: [
        { id: 1, properties: { type: 'way', id: 10 } },
        { id: 2, properties: { type: 'node', id: 11 } },
      ],
    }
    const { map, calls } = createMapRecorder()

    setSelectedFeatureState(map, geojson, 'way', 10)
    calls.length = 0
    setSelectedFeatureState(map, geojson, 'node', 11)

    expect(calls).toEqual([
      { id: 1, state: { selected: false } },
      { id: 2, state: { selected: true } },
    ])
  })
})
