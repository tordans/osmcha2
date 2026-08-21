import { describe, expect, it } from 'vitest'
import {
  AUTH_READY_TYPE,
  appEntryUrl,
  authReadyPayload,
  BOOKMARKLET_SOURCE,
  buildCopyAuthBookmarklet,
  buildOpenSignedInBookmarklet,
  isAllowedHandoffOrigin,
  isAuthReadyMessage,
  parseBookmarkletAuthMessage,
} from './bookmarkletAuthHandoff.ts'

describe('isAllowedHandoffOrigin', () => {
  it('allows only osmcha.org origins', () => {
    expect(isAllowedHandoffOrigin('https://osmcha.org')).toBe(true)
    expect(isAllowedHandoffOrigin('https://www.osmcha.org')).toBe(true)
    expect(isAllowedHandoffOrigin('https://tordans.github.io')).toBe(false)
    expect(isAllowedHandoffOrigin('http://127.0.0.1:3000')).toBe(false)
    expect(isAllowedHandoffOrigin('https://evil.com')).toBe(false)
  })
})

describe('parseBookmarkletAuthMessage', () => {
  it('returns null for wrong shape or source', () => {
    expect(parseBookmarkletAuthMessage(null)).toBeNull()
    expect(parseBookmarkletAuthMessage('auth')).toBeNull()
    expect(parseBookmarkletAuthMessage({ source: 'other', auth: 'abc' })).toBeNull()
    expect(parseBookmarkletAuthMessage({ source: BOOKMARKLET_SOURCE })).toBeNull()
    expect(parseBookmarkletAuthMessage({ source: BOOKMARKLET_SOURCE, auth: 1 })).toBeNull()
  })

  it('parses raw, Token-prefixed, and persist JSON auth strings', () => {
    expect(parseBookmarkletAuthMessage({ source: BOOKMARKLET_SOURCE, auth: 'abc123' })).toBe(
      'abc123',
    )
    expect(parseBookmarkletAuthMessage({ source: BOOKMARKLET_SOURCE, auth: 'Token abc123' })).toBe(
      'abc123',
    )
    expect(
      parseBookmarkletAuthMessage({
        source: BOOKMARKLET_SOURCE,
        auth: '{"state":{"token":"abc123"},"version":0}',
      }),
    ).toBe('abc123')
  })

  it('returns null when auth string has no token', () => {
    expect(
      parseBookmarkletAuthMessage({ source: BOOKMARKLET_SOURCE, auth: '{"state":{}}' }),
    ).toBeNull()
    expect(parseBookmarkletAuthMessage({ source: BOOKMARKLET_SOURCE, auth: '   ' })).toBeNull()
  })
})

describe('isAuthReadyMessage', () => {
  it('matches only the ready type', () => {
    expect(isAuthReadyMessage(authReadyPayload())).toBe(true)
    expect(isAuthReadyMessage({ type: AUTH_READY_TYPE })).toBe(true)
    expect(isAuthReadyMessage({ type: 'other' })).toBe(false)
    expect(isAuthReadyMessage(null)).toBe(false)
  })
})

describe('appEntryUrl', () => {
  it('joins origin and Vite base', () => {
    expect(appEntryUrl('http://127.0.0.1:3000', '/')).toBe('http://127.0.0.1:3000/')
    expect(appEntryUrl('https://tordans.github.io', '/osmcha2/')).toBe(
      'https://tordans.github.io/osmcha2/',
    )
    expect(appEntryUrl('https://tordans.github.io', '/osmcha2')).toBe(
      'https://tordans.github.io/osmcha2/',
    )
  })
})

describe('bookmarklet builders', () => {
  it('builds a javascript: open-signed-in bookmarklet with baked URL and origin', () => {
    const href = buildOpenSignedInBookmarklet(
      'https://tordans.github.io/osmcha2/',
      'https://tordans.github.io',
    )
    expect(href.startsWith('javascript:')).toBe(true)
    const decoded = decodeURIComponent(href.slice('javascript:'.length))
    expect(decoded).toContain('https://tordans.github.io/osmcha2/')
    expect(decoded).toContain('https://tordans.github.io')
    expect(decoded).toContain(BOOKMARKLET_SOURCE)
    expect(decoded).toContain(AUTH_READY_TYPE)
    expect(decoded).toContain("localStorage.getItem('auth')")
    expect(decoded).toContain('osmcha.org')
  })

  it('builds a javascript: copy-auth bookmarklet', () => {
    const href = buildCopyAuthBookmarklet()
    expect(href.startsWith('javascript:')).toBe(true)
    const decoded = decodeURIComponent(href.slice('javascript:'.length))
    expect(decoded).toContain("localStorage.getItem('auth')")
    expect(decoded).toContain('clipboard')
    expect(decoded).toContain('osmcha.org')
  })
})
