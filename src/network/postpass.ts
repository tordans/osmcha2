import { z } from 'zod'

// The public Postpass service (https://github.com/woodpeck/postpass) answers SQL over HTTP. It is
// free and has no usage terms we could lean on, so this client stays small and careful.
const POSTPASS_URL = 'https://postpass.geofabrik.de/api/interpreter'
const CACHE_SECONDS = 600
const TIMEOUT_MS = 20_000
/** Postpass sends neither a size nor compression: reading stops here. */
const MAX_RESPONSE_BYTES = 4 * 1024 * 1024
export const MAX_SURROUNDINGS_OBJECTS = 5000

const OSM_TYPES = { N: 'node', W: 'way', R: 'relation' } as const

const responseSchema = z.object({
  postpass_properties: z.object({ timestamp: z.string() }),
  features: z.array(
    z.object({
      geometry: z.looseObject({ type: z.string() }).nullable(),
      properties: z.object({
        osm_type: z.enum(['N', 'W', 'R']),
        osm_id: z.number(),
        polygon: z.boolean(),
        closed: z.boolean(),
        tags: z.record(z.string(), z.string()),
      }),
    }),
  ),
})

type Box = { west: number; south: number; east: number; north: number }

function assertValidBox({ west, south, east, north }: Box) {
  const inRange =
    [west, south, east, north].every(Number.isFinite) &&
    west >= -180 &&
    east <= 180 &&
    south >= -90 &&
    north <= 90 &&
    west < east &&
    south < north
  if (!inRange) throw new Error('Invalid map area')
}

/**
 * Whole relations reach far beyond the box: everything is cut to it, which keeps a dense box near
 * 1 MB. Route and boundary relations only repeat the streets they run along and would fill the
 * hover. `box` is the only value in this query.
 */
export function surroundingsSql(box: Box) {
  assertValidBox(box)
  const envelope = `ST_MakeEnvelope(${box.west}, ${box.south}, ${box.east}, ${box.north}, 4326)`
  // Areas are cut as outlines: a cut polygon would close itself along the edge of the box. Their
  // rings run counter-clockwise, so that a line offset lands inside the area. Postpass keeps some
  // areas as closed lines, in the direction they were drawn: those are turned the same way.
  const polygon = 'ST_Dimension(geom) = 2'
  const ring = 'ST_Dimension(geom) = 1 AND ST_IsClosed(geom)'
  const outline = `CASE
    WHEN ${polygon} THEN ST_Boundary(ST_ForcePolygonCCW(geom))
    WHEN ${ring} THEN COALESCE(ST_Boundary(ST_ForcePolygonCCW(ST_BuildArea(geom))), geom)
    ELSE geom
  END`
  return `SELECT osm_type, osm_id, tags,
  ${polygon} AS polygon,
  ${polygon} OR ST_IsClosed(geom) AS closed,
  ST_ClipByBox2D(${outline}, ${envelope}) AS geom
FROM postpass_pointlinepolygon
WHERE geom && ${envelope}
  AND NOT (osm_type = 'R' AND (tags ? 'route' OR tags ? 'route_master' OR tags ? 'boundary'))
LIMIT ${MAX_SURROUNDINGS_OBJECTS}`
}

async function readLimited(response: Response) {
  if (!response.body) throw new Error('Postpass sent no data')
  const reader = response.body.getReader()
  const chunks: Uint8Array<ArrayBuffer>[] = []
  let bytes = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    bytes += value.byteLength
    if (bytes > MAX_RESPONSE_BYTES) {
      await reader.cancel()
      throw new Error('This area has too much data')
    }
    chunks.push(value)
  }
  return new Blob(chunks).text()
}

function isEmptyGeometry(geometry: { type: string; coordinates?: unknown }) {
  return !Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0
}

/** Parses an answer into map features. Clipping can leave nothing of an object's geometry. */
export function parseSurroundings(text: string) {
  const { postpass_properties, features } = responseSchema.parse(JSON.parse(text))
  return {
    timestamp: postpass_properties.timestamp,
    truncated: features.length >= MAX_SURROUNDINGS_OBJECTS,
    features: features.flatMap(({ geometry, properties }): GeoJSON.Feature[] =>
      geometry && !isEmptyGeometry(geometry)
        ? [
            {
              type: 'Feature',
              geometry: geometry as unknown as GeoJSON.Geometry,
              properties: {
                osmType: OSM_TYPES[properties.osm_type],
                osmId: properties.osm_id,
                polygon: properties.polygon,
                closed: properties.closed,
                // MapLibre would turn the nested object into this string anyway.
                tags: JSON.stringify(properties.tags),
              },
            },
          ]
        : [],
    ),
  }
}

/** One request, no retry. Plain `fetch`: `request.ts` would add our API token. */
export async function fetchSurroundings(box: Box, signal: AbortSignal) {
  const url = new URL(POSTPASS_URL)
  url.searchParams.set('data', surroundingsSql(box))
  url.searchParams.set('cache_for', String(CACHE_SECONDS))
  const response = await fetch(url, {
    credentials: 'omit',
    signal: AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]),
  })
  if (!response.ok) throw new Error(`Postpass answered ${response.status}`)
  return parseSurroundings(await readLimited(response))
}
