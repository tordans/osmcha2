import { useEffect } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '../stores/authStore.ts'
import {
  ALLOWED_HANDOFF_ORIGINS,
  authReadyPayload,
  isAllowedHandoffOrigin,
  parseBookmarkletAuthMessage,
} from '../utils/bookmarkletAuthHandoff.ts'

/**
 * Accepts osmcha.org bookmarklet postMessage auth, and pings the opener when ready.
 */
export function useBookmarkletAuthHandoff() {
  useEffect(function listenForBookmarkletAuthHandoff() {
    function onBookmarkletMessage(event: MessageEvent) {
      if (!isAllowedHandoffOrigin(event.origin)) return
      const token = parseBookmarkletAuthMessage(event.data)
      if (!token) return
      useAuthStore.getState().setToken(token)
      toast.success('Signed in from osmcha.org')
    }

    window.addEventListener('message', onBookmarkletMessage)

    const opener = window.opener
    if (opener) {
      const ready = authReadyPayload()
      for (const origin of ALLOWED_HANDOFF_ORIGINS) {
        try {
          opener.postMessage(ready, origin)
        } catch {
          // Opener may be closed or cross-origin restricted.
        }
      }
    }

    return function stopListeningForBookmarkletAuthHandoff() {
      window.removeEventListener('message', onBookmarkletMessage)
    }
  }, [])
}
