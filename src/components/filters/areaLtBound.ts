/**
 * Helpers for visualizing OSMCha's `area_lt` filter.
 *
 * Django compares planar degree² areas (GEOS Polygon.area), not geodesic m².
 * Keep changeset.area < N * filter_area when a geometry/in_bbox is present.
 */

export type Bbox = [west: number, south: number, east: number, north: number]

/** Absolute planar area of a closed ring in degree² (shoelace). */
function ringAreaDegree2(ring: GeoJSON.Position[]): number {
  if (ring.length < 4) return 0
  let sum = 0
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i]!
    const [x2, y2] = ring[i + 1]!
    sum += x1 * y2 - x2 * y1
  }
  return Math.abs(sum) / 2
}

/** Planar degree² area of a Polygon or MultiPolygon (outer rings minus holes). */
export function planarAreaDegree2(geometry: GeoJSON.Geometry): number {
  if (geometry.type === 'Polygon') {
    return polygonAreaDegree2(geometry.coordinates)
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.reduce((sum, polygon) => sum + polygonAreaDegree2(polygon), 0)
  }
  return 0
}

function polygonAreaDegree2(coordinates: GeoJSON.Position[][]): number {
  if (coordinates.length === 0) return 0
  const [outer, ...holes] = coordinates
  let area = ringAreaDegree2(outer!)
  for (const hole of holes) {
    area -= ringAreaDegree2(hole)
  }
  return Math.max(0, area)
}

export function bboxOfGeometry(geometry: GeoJSON.Geometry): Bbox | null {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  function visit(
    coords: GeoJSON.Position | GeoJSON.Position[] | GeoJSON.Position[][] | GeoJSON.Position[][][],
  ) {
    if (typeof coords[0] === 'number') {
      const [x, y] = coords as GeoJSON.Position
      if (Number.isFinite(x) && Number.isFinite(y)) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
      return
    }
    for (const child of coords as Array<
      GeoJSON.Position | GeoJSON.Position[] | GeoJSON.Position[][] | GeoJSON.Position[][][]
    >) {
      visit(child)
    }
  }

  if (geometry.type === 'GeometryCollection') {
    for (const child of geometry.geometries) {
      const childBbox = bboxOfGeometry(child)
      if (!childBbox) continue
      minX = Math.min(minX, childBbox[0])
      minY = Math.min(minY, childBbox[1])
      maxX = Math.max(maxX, childBbox[2])
      maxY = Math.max(maxY, childBbox[3])
    }
  } else if ('coordinates' in geometry) {
    visit(geometry.coordinates)
  }

  if (
    !Number.isFinite(minX) ||
    !Number.isFinite(minY) ||
    !Number.isFinite(maxX) ||
    !Number.isFinite(maxY)
  ) {
    return null
  }
  return [minX, minY, maxX, maxY]
}

function rectanglePolygon(bbox: Bbox): GeoJSON.Polygon {
  const [west, south, east, north] = bbox
  return {
    type: 'Polygon',
    coordinates: [
      [
        [west, south],
        [east, south],
        [east, north],
        [west, north],
        [west, south],
      ],
    ],
  }
}

/**
 * Example rectangle whose area equals `N * filterArea`, centered on the filter
 * bbox and keeping that bbox's aspect ratio. Visualizes the largest allowed
 * changeset bbox area — not a buffer around the location.
 */
export function areaLtBoundPolygon(
  geometry: GeoJSON.Geometry,
  areaLt: number,
): GeoJSON.Polygon | null {
  if (!Number.isFinite(areaLt) || areaLt <= 0) return null

  const filterArea = planarAreaDegree2(geometry)
  if (!(filterArea > 0)) return null

  const bounds = bboxOfGeometry(geometry)
  if (!bounds) return null

  const [west, south, east, north] = bounds
  const width = east - west
  const height = north - south
  if (!(width > 0) || !(height > 0)) return null

  const maxArea = areaLt * filterArea
  const aspect = width / height
  const overlayHeight = Math.sqrt(maxArea / aspect)
  const overlayWidth = aspect * overlayHeight
  const cx = (west + east) / 2
  const cy = (south + north) / 2

  return rectanglePolygon([
    cx - overlayWidth / 2,
    cy - overlayHeight / 2,
    cx + overlayWidth / 2,
    cy + overlayHeight / 2,
  ])
}

export function parseAreaLt(value: unknown): number | null {
  if (value == null || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}
