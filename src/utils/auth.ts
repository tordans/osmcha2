import { toast } from 'sonner'
import { postFinalTokensOSMCha } from '../network/auth.ts'
import { useAuthStore } from '../stores/authStore.ts'

/**
 * OSM OAuth only completes when this origin is a registered redirect:
 * localhost / 127.0.0.1 (Django origin override) or osmcha.org.
 * Other public hosts (e.g. github.io) must paste an API token.
 */
export function isOsmOAuthHost(hostname: string = window.location.hostname): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === 'osmcha.org' ||
    hostname === 'www.osmcha.org'
  )
}

/**
 * Paste this on osmcha.org’s DevTools Console to copy the persisted auth JSON.
 * `copy()` is a Chrome/Edge/Firefox DevTools helper (not a page API).
 */
export const OSMCHA_ORG_AUTH_CONSOLE_SNIPPET = "copy(localStorage.getItem('auth'))"

const TOKEN_PREFIX = /^token\s+/i

/**
 * Accepts anything a user might paste from osmcha.org: a raw DRF token,
 * `Token <token>` (Account copy button), or Zustand persist JSON
 * `{"state":{"token":"…"},"version":0}` from DevTools Local Storage.
 */
export function parseTokenPaste(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const fromJson = tokenFromAuthJson(trimmed)
  if (fromJson) return fromJson

  const withoutPrefix = trimmed.replace(TOKEN_PREFIX, '').trim()
  if (!withoutPrefix || withoutPrefix.startsWith('{')) return null
  return withoutPrefix
}

function tokenFromAuthJson(trimmed: string): string | null {
  if (trimmed[0] !== '{' && trimmed[0] !== '"') return null
  try {
    const parsed: unknown = JSON.parse(trimmed)
    if (typeof parsed === 'string') return parseTokenPaste(parsed)
    if (!parsed || typeof parsed !== 'object') return null
    const state = 'state' in parsed ? parsed.state : undefined
    if (!state || typeof state !== 'object') return null
    const token = 'token' in state ? state.token : undefined
    if (typeof token !== 'string') return null
    return parseTokenPaste(token)
  } catch {
    return null
  }
}

/**
 * If `search` contains a non-empty `token` param, return it and the same query
 * with `token` removed. Does not persist or log the value.
 *
 * Splits on `&` instead of URLSearchParams so OSMCha's unencoded JSON
 * `filters={...}` query is left intact.
 */
export function takeAuthTokenFromSearch(
  search: string,
): { token: string; nextSearch: string } | null {
  const raw = search.startsWith('?') ? search.slice(1) : search
  if (!raw) return null

  const rest: string[] = []
  let token = ''
  for (const part of raw.split('&')) {
    const eq = part.indexOf('=')
    const key = eq === -1 ? part : part.slice(0, eq)
    if (key === 'token') {
      if (!token) {
        const value = eq === -1 ? '' : part.slice(eq + 1)
        try {
          token = parseTokenPaste(decodeURIComponent(value.replace(/\+/g, ' '))) ?? ''
        } catch {
          token = parseTokenPaste(value) ?? ''
        }
      }
      continue
    }
    rest.push(part)
  }
  if (!token) return null
  const next = rest.join('&')
  return { token, nextSearch: next ? `?${next}` : '' }
}

/**
 * Completes OAuth login flow by exchanging code for token.
 */
export async function completeOAuthLogin(code: string) {
  try {
    toast.warning('Logging in…', { duration: 1000 })

    const { token } = (await postFinalTokensOSMCha(code)) as { token: string }

    if (!token || token === '') {
      throw new Error('Invalid token')
    }

    // Save to Zustand store (persists to localStorage under "auth" key)
    useAuthStore.getState().setToken(token)

    toast.success('Login successful')

    return token
  } catch (error) {
    console.error('Login error:', error)
    const err = error as Error
    toast.error('Login failed', { description: err.message })
    throw error
  }
}
