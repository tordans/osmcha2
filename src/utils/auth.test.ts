import { describe, expect, it } from 'vitest'
import { isOsmOAuthHost, takeAuthTokenFromSearch } from './auth.ts'

describe('isOsmOAuthHost', () => {
  it('allows OSM OAuth on localhost and osmcha.org', () => {
    expect(isOsmOAuthHost('localhost')).toBe(true)
    expect(isOsmOAuthHost('127.0.0.1')).toBe(true)
    expect(isOsmOAuthHost('osmcha.org')).toBe(true)
    expect(isOsmOAuthHost('www.osmcha.org')).toBe(true)
  })

  it('blocks OSM OAuth on other public hosts', () => {
    expect(isOsmOAuthHost('osmcha.github.io')).toBe(false)
    expect(isOsmOAuthHost('example.com')).toBe(false)
  })
})

describe('takeAuthTokenFromSearch', () => {
  it('returns null when token is absent or empty', () => {
    expect(takeAuthTokenFromSearch('')).toBeNull()
    expect(takeAuthTokenFromSearch('?filters=%7B%7D')).toBeNull()
    expect(takeAuthTokenFromSearch('?token=')).toBeNull()
    expect(takeAuthTokenFromSearch('?token=%20')).toBeNull()
  })

  it('returns the token and strips it from the query', () => {
    expect(takeAuthTokenFromSearch('?token=abc&filters=%7B%7D')).toEqual({
      token: 'abc',
      nextSearch: '?filters=%7B%7D',
    })
    expect(takeAuthTokenFromSearch('token=abc')).toEqual({
      token: 'abc',
      nextSearch: '',
    })
  })

  it('keeps unencoded JSON filters when stripping token', () => {
    expect(takeAuthTokenFromSearch('?filters={"uids":[]}&token=abc')).toEqual({
      token: 'abc',
      nextSearch: '?filters={"uids":[]}',
    })
  })
})
