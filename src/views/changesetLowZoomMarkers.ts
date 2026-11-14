import { ACTION } from '../components/changeset/actionColors.ts'

/**
 * Zoomed far out, a changed way or relation is smaller than a pixel and the map looks empty.
 * Below this zoom each changed way and relation also gets a point marker, like a tagged node.
 */
export const LOW_ZOOM_MARKER_MAX_ZOOM = 13

/** Feature property that tells a marker from the element it stands in for. */
export const LOW_ZOOM_MARKER_FILTER = ['==', 'lowzoom', true]

const LOW_ZOOM_MARKER_BG_LAYER_ID = 'changeset-lowzoom-marker-bg'
const LOW_ZOOM_MARKER_LAYER_ID = 'changeset-lowzoom-marker'

type Position = GeoJSON.Position

function midpointAlongLine(coordinates: Position[]): Position | null {
  if (coordinates.length === 0) return null
  if (coordinates.length === 1) return coordinates[0] ?? null
  const segments: number[] = []
  let total = 0
  for (let index = 1; index < coordinates.length; index++) {
    const [ax = 0, ay = 0] = coordinates[index - 1] ?? []
    const [bx = 0, by = 0] = coordinates[index] ?? []
    const length = Math.hypot(bx - ax, by - ay)
    segments.push(length)
    total += length
  }
  if (total === 0) return coordinates[0] ?? null
  let remaining = total / 2
  for (let index = 0; index < segments.length; index++) {
    const length = segments[index] ?? 0
    if (remaining <= length && length > 0) {
      const [ax = 0, ay = 0] = coordinates[index] ?? []
      const [bx = 0, by = 0] = coordinates[index + 1] ?? []
      const t = remaining / length
      return [ax + (bx - ax) * t, ay + (by - ay) * t]
    }
    remaining -= length
  }
  return coordinates.at(-1) ?? null
}

function boundsCenter(coordinates: Position[]): Position | null {
  let west = Infinity
  let south = Infinity
  let east = -Infinity
  let north = -Infinity
  for (const [lng, lat] of coordinates) {
    if (lng == null || lat == null) continue
    west = Math.min(west, lng)
    east = Math.max(east, lng)
    south = Math.min(south, lat)
    north = Math.max(north, lat)
  }
  if (![west, south, east, north].every(Number.isFinite)) return null
  return [(west + east) / 2, (south + north) / 2]
}

/** One representative point: the middle of a line, the center of an area's bounds. */
export function markerPosition(geometry: GeoJSON.Geometry | null | undefined): Position | null {
  if (!geometry) return null
  switch (geometry.type) {
    case 'LineString':
      return midpointAlongLine(geometry.coordinates)
    case 'Polygon':
      return boundsCenter(geometry.coordinates[0] ?? [])
    case 'MultiPolygon':
      return boundsCenter(geometry.coordinates.flatMap((polygon) => polygon[0] ?? []))
    case 'GeometryCollection': {
      throw new Error('Not implemented yet: "GeometryCollection" case')
    }
    case 'MultiLineString': {
      throw new Error('Not implemented yet: "MultiLineString" case')
    }
    case 'MultiPoint': {
      throw new Error('Not implemented yet: "MultiPoint" case')
    }
    case 'Point': {
      throw new Error('Not implemented yet: "Point" case')
    }
    default:
      return null
  }
}

/**
 * Adds one point per changed way and relation, sharing the element's feature id so selection,
 * hover and seen state reach the marker too. Old side only for a delete; new side otherwise.
 */
export function withLowZoomMarkers(geojson: GeoJSON.FeatureCollection): GeoJSON.FeatureCollection {
  const markers: GeoJSON.Feature[] = []
  for (const feature of geojson.features) {
    const properties = feature.properties
    const type = properties?.type
    if (type !== 'way' && type !== 'relation') continue
    const action = properties?.action
    if (action !== 'create' && action !== 'modify' && action !== 'delete') continue
    const wantedSide = action === 'delete' ? 'old' : 'new'
    if (properties?.side !== wantedSide) continue
    const position = markerPosition(feature.geometry)
    if (!position) continue
    const { relations: _relations, ...rest } = properties ?? {}
    markers.push({
      type: 'Feature',
      id: feature.id,
      properties: { ...rest, lowzoom: true },
      geometry: { type: 'Point', coordinates: position },
    })
  }
  if (markers.length === 0) return geojson
  return { ...geojson, features: [...geojson.features, ...markers] }
}

/** The same colors as the lines: a geometry-only modify is white like its line. */
const MARKER_COLOR: unknown[] = [
  'match',
  ['get', 'action'],
  'create',
  ACTION.create.hex,
  'modify',
  ['case', ['boolean', ['get', 'tags_changed'], false], ACTION.modify.hex, '#EFEFEF'],
  'delete',
  ACTION.delete.hex,
  ACTION.noop.hex,
]

/** Dark case only. The selection and hover halo lives with the other halos in the emphasis layers. */
const CASE_COLOR = 'hsla(0, 0%, 15%, 0.5)'

type MarkerLayer = {
  id: string
  type: 'circle'
  source: string
  maxzoom: number
  filter: unknown[]
  layout: Record<string, string>
  paint: Record<string, unknown>
}

/**
 * The case layer ends in `-bg` so it sits with the other cases, under every colored line.
 * Legacy filter syntax only, like the viewer's own layers.
 */
export function lowZoomMarkerLayers(options: {
  source: string
  showElements: string[]
  showActions: string[]
}): MarkerLayer[] {
  const elements = options.showElements.filter((type) => type === 'way' || type === 'relation')
  const filter = [
    'all',
    LOW_ZOOM_MARKER_FILTER,
    ['in', 'type', ...elements],
    ['in', 'action', ...options.showActions],
  ]
  const visibility = elements.length > 0 ? 'visible' : 'none'
  return [
    {
      id: LOW_ZOOM_MARKER_BG_LAYER_ID,
      type: 'circle',
      source: options.source,
      maxzoom: LOW_ZOOM_MARKER_MAX_ZOOM,
      filter,
      layout: { visibility },
      paint: {
        'circle-radius': 7,
        'circle-color': CASE_COLOR,
      },
    },
    {
      id: LOW_ZOOM_MARKER_LAYER_ID,
      type: 'circle',
      source: options.source,
      maxzoom: LOW_ZOOM_MARKER_MAX_ZOOM,
      filter,
      layout: { visibility },
      paint: {
        'circle-radius': 4,
        'circle-color': MARKER_COLOR,
        'circle-stroke-width': 1.5,
        // A tagged node has a white ring; a dark one sets the stand-in marker apart.
        'circle-stroke-color': '#18181b',
      },
    },
  ]
}
