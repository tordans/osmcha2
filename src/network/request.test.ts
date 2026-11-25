import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  api,
  isMissingCredentialsError,
  MISSING_CREDENTIALS_MESSAGE,
  RequestTooLargeError,
  retryUnlessRefused,
} from './request.ts'

describe('isMissingCredentialsError', () => {
  it('matches the Django unauthenticated detail string', () => {
    expect(isMissingCredentialsError(new Error(MISSING_CREDENTIALS_MESSAGE))).toBe(true)
    expect(isMissingCredentialsError(new Error('Invalid token.'))).toBe(false)
    expect(isMissingCredentialsError('nope')).toBe(false)
  })
})

describe('retryUnlessRefused', () => {
  const retry = retryUnlessRefused(3)

  it('retries network and server errors up to the limit', () => {
    expect(retry(0, new TypeError('Failed to fetch'))).toBe(true)
    expect(retry(2, new ApiError(502, 'Bad Gateway'))).toBe(true)
    expect(retry(3, new ApiError(502, 'Bad Gateway'))).toBe(false)
  })

  it('does not repeat a refused request', () => {
    expect(retry(0, new ApiError(400, 'Bad Request'))).toBe(false)
    expect(retry(0, new ApiError(429, 'Too Many Requests'))).toBe(false)
    expect(retry(0, new RequestTooLargeError(5000))).toBe(false)
  })
})

describe('api.get', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not send a request OSMCha would refuse for its length', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const geometry = encodeURIComponent(JSON.stringify({ coordinates: 'x'.repeat(4000) }))
    await expect(api.get(`/changesets/?geometry=${geometry}`)).rejects.toBeInstanceOf(
      RequestTooLargeError,
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends a request within the limit and reports an error status', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Invalid filter.' }), { status: 400 }),
      )
    vi.stubGlobal('fetch', fetchMock)
    const error = await api.get('/changesets/?page=1').catch((caught: unknown) => caught)
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(400)
    expect((error as ApiError).message).toBe('Invalid filter.')
  })
})
