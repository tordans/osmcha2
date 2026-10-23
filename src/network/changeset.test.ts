import { afterEach, describe, expect, test, vi } from 'vitest'
import { adiffServiceUrl, overpassBase } from '../config/constants.ts'
import { AdiffNotFoundError, fetchAndParseAugmentedDiff } from './changeset.ts'

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
