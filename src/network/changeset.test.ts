import { afterEach, describe, expect, test, vi } from 'vitest'
import { adiffServiceUrl, overpassBase } from '../config/constants.ts'
import {
  AdiffNotFoundError,
  changesetFeatureSchema,
  fetchAndParseAugmentedDiff,
} from './changeset.ts'

describe('fetchAndParseAugmentedDiff', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('throws AdiffNotFoundError on a 404 and does not query Overpass', async () => {
    const fetchMock = vi.fn(
      async (_input: string) => new Response('', { status: 404, statusText: 'Not Found' }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const error = await fetchAndParseAugmentedDiff(42).catch((err: unknown) => err)

    expect(error).toBeInstanceOf(AdiffNotFoundError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${adiffServiceUrl}/changesets/42.adiff`)
    expect(fetchMock.mock.calls.some(([url]) => (url ?? '').startsWith(overpassBase))).toBe(false)
  })

  test('other adiff service failures stay plain errors without an Overpass request', async () => {
    const fetchMock = vi.fn(
      async (_input: string) => new Response('', { status: 503, statusText: 'Unavailable' }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const error = await fetchAndParseAugmentedDiff(42).catch((err: unknown) => err)

    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(AdiffNotFoundError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('changesetFeatureSchema', () => {
  const properties = {
    user: 'mapper',
    reasons: [{ id: '3', name: 'Possible import' }],
    tags: [],
    features: [],
    reviewed_features: [],
    is_suspect: true,
    harmful: null,
    checked: false,
  }

  test('keeps flagged features with odd fields and drops what is not an object', () => {
    const parsed = changesetFeatureSchema.parse({
      id: 1,
      geometry: null,
      properties: {
        ...properties,
        features: [{ url: 'way-5', osm_id: 5, name: null, reasons: [3], note: 7 }, 'junk', null],
        reviewed_features: [{ id: 'node-9', user: 'reviewer' }, 42],
        metadata: { host: 'https://www.openstreetmap.org/edit', changesets_count: 12, flag: true },
      },
    })

    expect(parsed.properties.features).toEqual([
      { url: 'way-5', osm_id: 5, name: undefined, reasons: [3], note: undefined },
    ])
    expect(parsed.properties.reviewed_features).toEqual([{ id: 'node-9', user: 'reviewer' }])
    expect(parsed.properties.reasons).toEqual([{ id: 3, name: 'Possible import' }])
    expect(parsed.properties.metadata).toEqual({
      host: 'https://www.openstreetmap.org/edit',
      changesets_count: '12',
    })
  })
})
