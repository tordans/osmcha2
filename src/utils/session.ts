import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { isRejectedOsmchaToken } from '../network/request.ts'
import { logoutOsm } from '../notes/osmAuthClient.ts'
import { queryClient } from '../query/client.ts'
import { getAuthActions, getAuthToken } from '../stores/auth-store.ts'

/**
 * Signs in with an OSMCha token. Cached answers belong to the previous account (user details,
 * watchlist, review state), so a different token starts with an empty cache.
 *
 * `fromLink`: the token arrived through a link (`?token=`, an OAuth callback). A link must not
 * switch an account that is already signed in: someone could send one to make a reviewer work
 * in the sender's account. Returns false when it was refused.
 */
export function signInWithToken(token: string, { fromLink = false } = {}): boolean {
  const current = getAuthToken()
  if (current === token) return true
  if (fromLink && current) {
    toast.warning('Already signed in', {
      description: 'Log out first to sign in with another account.',
    })
    return false
  }
  if (current) queryClient.clear()
  getAuthActions().setToken(token)
  return true
}

/** Ends both sign-ins: the OSMCha token with its cached answers, and the OpenStreetMap token. */
export function signOut() {
  getAuthActions().clearAuth()
  queryClient.clear()
  logoutOsm()
}

/**
 * OSMCha answers 401 to a token it no longer accepts (revoked, or replaced on osmcha.org). Without
 * this the app kept showing a signed-in state whose requests all failed.
 */
export function signOutWhenTokenExpires(client: QueryClient = queryClient) {
  const onError = (error: unknown) => {
    if (!isRejectedOsmchaToken(error) || !getAuthToken()) return
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
