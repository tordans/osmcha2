import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  fetchSurroundings,
  MAX_SURROUNDINGS_OBJECTS,
  parseSurroundings,
  surroundingsSql,
} from './postpass.ts'

const box = { west: 13.43, south: 52.49, east: 13.44, north: 52.5 }
const answer = (features: unknown[]) =>
  JSON.stringify({ postpass_properties: { timestamp: '2026-10-31T05:52:25Z' }, features })
const feature = (geometry: unknown, osm_type = 'W') => ({
  type: 'Feature',
  geometry,
  properties: { osm_type, osm_id: 7, polygon: false, closed: true, tags: { type: 'yes' } },
})
const line = {
  type: 'MultiLineString',
  coordinates: [
    [
      [13, 52],
      [13.1, 52],
    ],
  ],
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('surroundingsSql', () => {
  test('holds only the four numbers, clips to them and limits the result', () => {
    const sql = surroundingsSql(box)
    expect(sql).toContain('ST_MakeEnvelope(13.43, 52.49, 13.44, 52.5, 4326)')
    expect(sql).toContain('ST_ClipByBox2D')
    expect(sql).toContain('ST_ForcePolygonCCW(geom)')
    expect(sql).toContain('ST_ForcePolygonCCW(ST_BuildArea(geom))')
    expect(sql).toContain(`LIMIT ${MAX_SURROUNDINGS_OBJECTS}`)
  })

  test.each([
    { ...box, west: Number.NaN },
    { ...box, east: Number.POSITIVE_INFINITY },
    { ...box, north: 91 },
    { ...box, west: 14 },
    { ...box, south: '0); DROP TABLE x;--' as unknown as number },
  ])('refuses %j', (bad) => {
    expect(() => surroundingsSql(bad)).toThrow('Invalid map area')
  })
})

describe('parseSurroundings', () => {
  test('keeps tags as JSON and names the type, without a feature id', () => {
    const { features, timestamp, truncated } = parseSurroundings(answer([feature(line)]))
    expect(timestamp).toBe('2026-10-31T05:52:25Z')
    expect(truncated).toBe(false)
    expect(features).toEqual([
      {
        type: 'Feature',
        geometry: line,
        properties: {
          osmType: 'way',
          osmId: 7,
          polygon: false,
          closed: true,
          tags: '{"type":"yes"}',
        },
      },
    ])
  })

  test('drops objects the clip left empty', () => {
    const empty = { type: 'GeometryCollection', geometries: [] }
    expect(parseSurroundings(answer([feature(empty), feature(null)])).features).toEqual([])
  })

  test('says when the limit cut the result', () => {
    const full = Array.from({ length: MAX_SURROUNDINGS_OBJECTS }, () => feature(line))
    expect(parseSurroundings(answer(full)).truncated).toBe(true)
  })
})

describe('fetchSurroundings', () => {
  const signal = new AbortController().signal

  test('sends one GET with the query and without credentials', async () => {
    const fetchMock = vi.fn(async () => new Response(answer([])))
    vi.stubGlobal('fetch', fetchMock)
    await fetchSurroundings(box, signal)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit]
    expect(url.searchParams.get('cache_for')).toBe('600')
    expect(url.searchParams.get('data')).toBe(surroundingsSql(box))
    expect(init.credentials).toBe('omit')
  })

  test('stops reading above the size limit', async () => {
    const cancel = vi.fn()
    let pulls = 0
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1
        controller.enqueue(new Uint8Array(1024 * 1024))
      },
      cancel,
    })
    vi.stubGlobal('fetch', async () => new Response(body))
    await expect(fetchSurroundings(box, signal)).rejects.toThrow('too much data')
    expect(cancel).toHaveBeenCalled()
    expect(pulls).toBeLessThan(10)
  })

  test('reports an error answer once, without trying again', async () => {
    const fetchMock = vi.fn(async () => new Response('busy', { status: 429 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchSurroundings(box, signal)).rejects.toThrow('429')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
