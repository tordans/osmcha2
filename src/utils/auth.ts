import { toast } from 'sonner'
import { z } from 'zod'
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

const persistAuthJsonSchema = z.object({
  state: z.object({
    token: z.string(),
  }),
})

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
    const asString = z.string().safeParse(parsed)
    if (asString.success) return parseTokenPaste(asString.data)
    const persist = persistAuthJsonSchema.safeParse(parsed)
    if (!persist.success) return null
    return parseTokenPaste(persist.data.state.token)
  } catch {
    return null
  }
}

/**
 * Completes OAuth login flow by exchanging code for token.
 */
export async function completeOAuthLogin(code: string) {
  try {
    toast.warning('Logging in…', { duration: 1000 })

    const { token } = await postFinalTokensOSMCha(code)

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
