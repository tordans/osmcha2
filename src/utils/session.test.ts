import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { API_URL } from '../config/constants.ts'
import { ApiError, isRejectedOsmchaToken } from '../network/request.ts'
import { queryClient } from '../query/client.ts'
import { getAuthActions, getAuthToken } from '../stores/auth-store.ts'
import { signInWithToken, watchSession } from './session.ts'

vi.mock('sonner', () => ({ toast: { warning: vi.fn(), error: vi.fn() } }))

beforeAll(() => {
  watchSession(queryClient)
})

beforeEach(() => {
  getAuthActions().clearAuth()
  queryClient.clear()
})

describe('signInWithToken', () => {
  it('a link does not replace an account that is signed in', () => {
    signInWithToken('mine')
    expect(signInWithToken('theirs', { fromLink: true })).toBe(false)
    expect(getAuthToken()).toBe('mine')
  })

  it('a link signs in when nobody is signed in', () => {
    expect(signInWithToken('theirs', { fromLink: true })).toBe(true)
    expect(getAuthToken()).toBe('theirs')
  })

  it('another token drops the answers cached for the previous account', () => {
    signInWithToken('first')
    queryClient.setQueryData(['user', 'details'], { username: 'first' })
    signInWithToken('second')
    expect(queryClient.getQueryData(['user', 'details'])).toBeUndefined()
  })
})

describe('watchSession', () => {
  const rejected = () =>
    queryClient
      .fetchQuery({
        queryKey: ['probe', Math.random()],
        queryFn: () => Promise.reject(new ApiError(401, 'Invalid token.', `${API_URL}/users/`)),
        retry: false,
      })
      .catch(() => {})

  it('signs out when OSMCha rejects the token', async () => {
    signInWithToken('dead')
    await rejected()
    expect(getAuthToken()).toBeNull()
  })

  it('uses a link token that was refused for the dead sign-in', async () => {
    signInWithToken('dead')
    signInWithToken('fresh', { fromLink: true })
    await rejected()
    expect(getAuthToken()).toBe('fresh')
  })
})

describe('isRejectedOsmchaToken', () => {
  it('only counts a 401 from OSMCha', () => {
    expect(isRejectedOsmchaToken(new ApiError(401, 'Invalid token.', `${API_URL}/users/`))).toBe(
      true,
    )
    expect(isRejectedOsmchaToken(new ApiError(401, 'x', 'https://api.openstreetmap.org/'))).toBe(
      false,
    )
    expect(isRejectedOsmchaToken(new ApiError(403, 'x', `${API_URL}/users/`))).toBe(false)
  })
})
