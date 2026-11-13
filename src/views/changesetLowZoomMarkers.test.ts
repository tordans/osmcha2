import { describe, expect, it } from 'vitest'
import { markerPosition, withLowZoomMarkers } from './changesetLowZoomMarkers.ts'

function feature(
  id: number,
  properties: Record<string, unknown>,
  geometry: GeoJSON.Geometry,
): GeoJSON.Feature {
  return { type: 'Feature', id, properties, geometry }
}

describe('markerPosition', () => {
  it('puts a line marker halfway along the line', () => {
    expect(
      markerPosition({
        type: 'LineString',
        coordinates: [
          [0, 0],
          [2, 0],
          [2, 2],
        ],
      }),
    ).toEqual([2, 0])
  })

  it('puts an area marker in the center of its bounds', () => {
    expect(
      markerPosition({
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [4, 0],
            [4, 2],
            [0, 2],
            [0, 0],
          ],
        ],
      }),
    ).toEqual([2, 1])
  })
})

describe('withLowZoomMarkers', () => {
  const line: GeoJSON.Geometry = {
    type: 'LineString',
    coordinates: [
      [0, 0],
      [1, 0],
    ],
  }

  it('adds one marker per changed way, sharing its feature id', () => {
    const result = withLowZoomMarkers({
      type: 'FeatureCollection',
      features: [
        feature(0, { type: 'way', id: 1, action: 'modify', side: 'old' }, line),
        feature(0, { type: 'way', id: 1, action: 'modify', side: 'new' }, line),
        feature(1, { type: 'way', id: 2, action: 'delete', side: 'old' }, line),
        feature(2, { type: 'way', id: 3, action: 'noop' }, line),
        feature(
          3,
          { type: 'node', id: 4, action: 'create', side: 'new' },
          {
            type: 'Point',
            coordinates: [0, 0],
          },
        ),
      ],
    })
    const markers = result.features.filter((item) => item.properties?.lowzoom === true)
    expect(markers.map((item) => [item.id, item.properties?.id, item.properties?.side])).toEqual([
      [0, 1, 'new'],
      [1, 2, 'old'],
    ])
    expect(markers[0]?.geometry).toEqual({ type: 'Point', coordinates: [0.5, 0] })
  })
})
