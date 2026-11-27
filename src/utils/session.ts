import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { isRejectedOsmchaToken } from '../network/request.ts'
import { logoutOsm } from '../notes/osmAuthClient.ts'
import { queryClient } from '../query/client.ts'
import { getAuthActions, getAuthToken, onAuthTokenChange } from '../stores/auth-store.ts'

/** A link token refused because someone was signed in; used if that sign-in turns out dead. */
let refusedLink: { token: string; insteadOf: string } | null = null

/**
 * Signs in with an OSMCha token. The cache is cleared on every token change, see
 * `watchSession`.
 *
 * `fromLink`: the token arrived through a link (`?token=`, an OAuth callback). A link must not
 * switch an account that is already signed in: someone could send one to make a reviewer work
 * in the sender's account. Returns false when it was refused.
 */
export function signInWithToken(token: string, { fromLink = false } = {}): boolean {
  const current = getAuthToken()
  if (current === token) return true
  if (fromLink && current) {
    refusedLink = { token, insteadOf: current }
    toast.warning('Already signed in', {
      description: 'Log out first to sign in with another account.',
    })
    return false
  }
  getAuthActions().setToken(token)
  return true
}

/** Ends both sign-ins: the OSMCha token with its cached answers, and the OpenStreetMap token. */
export function signOut() {
  getAuthActions().clearAuth()
  logoutOsm()
}

/**
 * Keeps the session consistent, once at startup:
 * - Cached answers belong to one account (user details, watchlist), so every token change clears
 *   them, also one that came from another tab.
 * - OSMCha answers 401 to a token it no longer accepts (revoked, or replaced on osmcha.org).
 *   Without this the app kept showing a signed-in state whose requests all failed. A link token
 *   refused for that dead sign-in is used instead.
 */
export function watchSession(client: QueryClient = queryClient) {
  onAuthTokenChange(() => client.clear())
  const onError = (error: unknown) => {
    if (!isRejectedOsmchaToken(error) || !getAuthToken()) return
    const replacement = refusedLink?.insteadOf === getAuthToken() ? refusedLink?.token : undefined
    refusedLink = null
    if (replacement) {
      getAuthActions().setToken(replacement)
      return
    }
    signOut()
    toast.error('Your OSMCha sign-in expired', { description: 'Please sign in again.' })
  }
  client.getQueryCache().subscribe((event) => {
    if (event.type === 'updated' && event.action.type === 'error') onError(event.action.error)
  })
  client.getMutationCache().subscribe((event) => {
    if (event.type === 'updated' && event.action.type === 'error') onError(event.action.error)
  })
}
