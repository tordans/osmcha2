import bboxPolygon from '@turf/bbox-polygon'
import type { NominatimPlace } from '../../network/nominatim.ts'

function isAreaGeometry(value: unknown): value is GeoJSON.Polygon | GeoJSON.MultiPolygon {
  if (!value || typeof value !== 'object') return false
  const { type, coordinates } = value as { type?: unknown; coordinates?: unknown }
  return (type === 'Polygon' || type === 'MultiPolygon') && Array.isArray(coordinates)
}

/**
 * The area a place result stands for. Nominatim answers many places (villages, squares,
 * streets) with a point or a line; those use the result's bounding box instead, so the
 * location filter always gets an area that shows on the map.
 */
export function placeGeometry(
  place: NominatimPlace,
): GeoJSON.Polygon | GeoJSON.MultiPolygon | null {
  if (isAreaGeometry(place.geojson)) return place.geojson
  const box = place.boundingbox?.map(Number)
  if (!box || box.length !== 4 || box.some((n) => !Number.isFinite(n))) return null
  const [south, north, west, east] = box as [number, number, number, number]
  if (south === north || west === east) return null
  return bboxPolygon([west, south, east, north]).geometry
}
