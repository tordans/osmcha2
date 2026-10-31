import { describe, expect, test } from 'vitest'
import type { AdiffAction } from '../components/changeset/changesetElements.ts'
import { unchangedModifiesAsContext } from './changesetAdiffViewer.ts'

function way(version: number, lat: number) {
  return { type: 'way', id: 7, version, nodes: [{ ref: 1, lon: 13, lat }], tags: {} }
}

function modify(before: ReturnType<typeof way>, after: ReturnType<typeof way>) {
  return { type: 'modify', old: before, new: after } as unknown as AdiffAction
}

function feature(side: string): GeoJSON.Feature {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [13, 52] },
    properties: { type: 'way', id: 7, action: 'modify', side },
  }
}

const geojson: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [feature('old'), feature('new')],
}

describe('unchangedModifiesAsContext', () => {
  test('makes a way that only came along with one of its nodes one context feature', () => {
    const { features } = unchangedModifiesAsContext(geojson, [modify(way(1, 52), way(1, 52))])
    expect(features.map((item) => item.properties)).toEqual([
      { type: 'way', id: 7, action: 'noop', side: undefined },
    ])
  })

  test('keeps a way whose node moved, though its version stays the same', () => {
    expect(unchangedModifiesAsContext(geojson, [modify(way(1, 52), way(1, 53))])).toBe(geojson)
  })
})
