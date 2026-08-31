import { describe, expect, it } from 'vitest'
import { isOsmOAuthHost, OSMCHA_ORG_AUTH_CONSOLE_SNIPPET, parseTokenPaste } from './auth.ts'

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

describe('parseTokenPaste', () => {
  it('returns null for empty or whitespace', () => {
    expect(parseTokenPaste('')).toBeNull()
    expect(parseTokenPaste('   ')).toBeNull()
  })

  it('accepts a raw token', () => {
    expect(parseTokenPaste('  abc123  ')).toBe('abc123')
  })

  it('strips a Token prefix from the Account copy button', () => {
    expect(parseTokenPaste('Token abc123')).toBe('abc123')
    expect(parseTokenPaste('token abc123')).toBe('abc123')
    expect(parseTokenPaste('TOKEN   abc123')).toBe('abc123')
  })

  it('extracts the token from osmcha.org Zustand persist JSON', () => {
    expect(parseTokenPaste('{"state":{"token":"abc123"},"version":0}')).toBe('abc123')
    expect(parseTokenPaste('  {"state":{"token":"abc123"},"version":0}  ')).toBe('abc123')
  })

  it('extracts a Token-prefixed value nested in persist JSON', () => {
    expect(parseTokenPaste('{"state":{"token":"Token abc123"},"version":0}')).toBe('abc123')
  })

  it('accepts persist JSON wrapped in extra JSON quotes', () => {
    expect(parseTokenPaste('"{\\"state\\":{\\"token\\":\\"abc123\\"}}"')).toBe('abc123')
  })

  it('returns null for JSON that is not persist auth', () => {
    expect(parseTokenPaste('{"foo":1}')).toBeNull()
    expect(parseTokenPaste('{"state":{}}')).toBeNull()
    expect(parseTokenPaste('{"state":{"token":null}}')).toBeNull()
    expect(parseTokenPaste('{not json')).toBeNull()
  })
})

describe('OSMCHA_ORG_AUTH_CONSOLE_SNIPPET', () => {
  it('copies the persist JSON from localStorage', () => {
    expect(OSMCHA_ORG_AUTH_CONSOLE_SNIPPET).toBe("copy(localStorage.getItem('auth'))")
  })
})
