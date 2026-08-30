import type { Map } from 'maplibre-gl'
import { describe, expect, test } from 'vitest'
import {
  getFeatureIdsForElement,
  syncHighlightedFeatureState,
  type ChangesetGeoJSON,
} from './changesetFeatureState.ts'

describe('syncHighlightedFeatureState', () => {
  test('clears previous hover then sets the active element', () => {
    const geojson: ChangesetGeoJSON = {
      features: [
        { id: 1, properties: { type: 'way', id: 10 } },
        { id: 2, properties: { type: 'node', id: 11 } },
      ],
    }
    const calls: Array<{ id: string | number; state: object }> = []
    const map = {
      setFeatureState: (_ref: { id: string | number }, state: object) => {
        calls.push({ id: _ref.id, state })
      },
    } as unknown as Map

    syncHighlightedFeatureState(map, geojson, { type: 'way', id: 10 })

    expect(calls).toEqual([
      { id: 1, state: { highlighted: false } },
      { id: 2, state: { highlighted: false } },
      { id: 1, state: { highlighted: true } },
    ])
    expect(getFeatureIdsForElement(geojson, 'way', 10)).toEqual([1])
  })

  test('clears all highlights when hover is empty', () => {
    const geojson: ChangesetGeoJSON = {
      features: [{ id: 1, properties: { type: 'way', id: 10 } }],
    }
    const calls: object[] = []
    const map = {
      setFeatureState: (_ref: unknown, state: object) => {
        calls.push(state)
      },
    } as unknown as Map

    syncHighlightedFeatureState(map, geojson, null)
    expect(calls).toEqual([{ highlighted: false }])
  })
})
