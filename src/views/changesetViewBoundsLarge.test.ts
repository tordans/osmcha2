import bbox from '@turf/bbox'
import { describe, expect, test } from 'vitest'
import {
  changesetViewBounds,
  featureBounds,
  geometryBounds,
  type ChangesetViewFeature,
} from './changesetViewBounds.ts'
import { changesetWorkAreas } from './changesetWorkAreas.ts'

/** Seeded generator so large synthetic inputs are the same on every run. */
function random(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

type Feature = ChangesetViewFeature & { geometry: GeoJSON.Geometry }

function randomGeometry(rand: () => number, [lng, lat]: [number, number]): GeoJSON.Geometry {
  const at = (spread: number): GeoJSON.Position => [
    lng + (rand() - 0.5) * spread,
    lat + (rand() - 0.5) * spread,
  ]
  const line = (count: number) => Array.from({ length: count }, () => at(0.01))
  const roll = rand()
  if (roll < 0.5) return { type: 'Point', coordinates: at(0.05) }
  if (roll < 0.7) return { type: 'LineString', coordinates: line(2 + Math.floor(rand() * 20)) }
  if (roll < 0.85) return { type: 'Polygon', coordinates: [line(4 + Math.floor(rand() * 8))] }
  if (roll < 0.95) return { type: 'MultiPolygon', coordinates: [[line(4)], [line(5)]] }
  return {
    type: 'GeometryCollection',
    geometries: [
      { type: 'Point', coordinates: at(0.05) },
      { type: 'LineString', coordinates: line(3) },
    ],
  }
}

/** Mixed changeset in a few places: nodes, way pairs, context noops, relations and deletes. */
function syntheticChangeset(count: number, centres: Array<[number, number]>, seed: number) {
  const rand = random(seed)
  const features: Feature[] = []
  let id = 1
  for (let i = 0; i < count; i++) {
    const centre = centres[Math.floor(rand() * centres.length)]!
    const roll = rand()
    if (roll < 0.55) {
      features.push({
        properties: {
          type: 'node',
          id: id++,
          action: rand() < 0.5 ? 'create' : 'modify',
          side: 'new',
          version: 1,
        },
        geometry: {
          type: 'Point',
          coordinates: [centre[0] + (rand() - 0.5) * 0.05, centre[1] + (rand() - 0.5) * 0.05],
        },
      })
    } else if (roll < 0.85) {
      const wayId = id++
      const geometry = randomGeometry(rand, centre)
      features.push({
        properties: { type: 'way', id: wayId, action: 'modify', side: 'old', version: 3 },
        geometry,
      })
      features.push({
        properties: { type: 'way', id: wayId, action: 'modify', side: 'new', version: 4 },
        geometry,
      })
    } else if (roll < 0.9) {
      features.push({
        properties: { type: 'node', id: id++, action: 'noop' },
        geometry: { type: 'Point', coordinates: centre },
      })
    } else if (roll < 0.93) {
      features.push({
        properties: { type: 'relation', id: id++, action: 'modify', side: 'new', version: 2 },
        geometry: randomGeometry(rand, centre),
      })
    } else {
      features.push({
        properties: { type: 'node', id: id++, action: 'delete', side: 'old', version: 2 },
        geometry: { type: 'Point', coordinates: centre },
      })
    }
  }
  return features
}

describe('featureBounds and geometryBounds', () => {
  test('match @turf/bbox over a large mixed-geometry collection', () => {
    const rand = random(7)
    const features: Feature[] = Array.from({ length: 2000 }, () => ({
      properties: { type: 'way', id: 1, action: 'modify' },
      geometry: randomGeometry(rand, [13.4 + rand(), 52.5 + rand()]),
    }))

    const collection: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: features.map((feature) => ({
        type: 'Feature',
        geometry: feature.geometry,
        properties: {},
      })),
    }
    expect(featureBounds(features)).toEqual(bbox(collection))

    for (const feature of features.slice(0, 200)) {
      const single: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: feature.geometry, properties: {} }],
      }
      expect(geometryBounds(feature.geometry)).toEqual(bbox(single))
    }
  })

  test('skips a NaN coordinate on its own axis and reports no bounds for an empty geometry', () => {
    expect(
      geometryBounds({
        type: 'LineString',
        coordinates: [
          [Number.NaN, 1],
          [2, 3],
        ],
      }),
    ).toEqual([2, 1, 2, 3])
    expect(geometryBounds({ type: 'Polygon', coordinates: [] })).toBeNull()
    expect(featureBounds([])).toBeNull()
  })
})

// Captured from the implementation before the single-pass bounds; the same input must keep matching.
const GOLDEN_AREAS: Array<[number, number, [number, number, number, number]]> = [
  [1, 1612, [-74.02499360517831, 40.67501598628005, -73.97505656816065, 40.72498980768724]],
  [2, 1584, [114.3750236555934, 22.735036051427016, 114.4249826612184, 22.784986695509872]],
  [3, 1548, [4.335019181868993, 51.98505826806882, 4.384981576052961, 52.03494539770996]],
]
const GOLDEN_VIEW = [-74.02499360517831, 22.735036051427016, 114.4249826612184, 52.03494539770996]

describe('large synthetic changeset', () => {
  const features = syntheticChangeset(
    5000,
    [
      [4.36, 52.01],
      [114.4, 22.76],
      [-74, 40.7],
    ],
    2,
  )

  test('keeps the same work areas as before', () => {
    const areas = changesetWorkAreas(features)

    expect(areas.map((area) => [area.id, area.elementKeys.size, area.bounds])).toEqual(GOLDEN_AREAS)
  })

  test('keeps the same view bounds as before', () => {
    expect(changesetViewBounds(features)).toEqual(GOLDEN_VIEW)
  })
})
