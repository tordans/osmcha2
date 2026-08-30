import { useEffect } from 'react'

const CHANNEL_ID = 'osm-api-auth-complete'

/** Popup landing page for osm-auth (BroadcastChannel, then close). */
export function OsmOauthLanding() {
  useEffect(function completeOsmAuthPopup() {
    const bc = new BroadcastChannel(CHANNEL_ID)
    bc.postMessage(window.location.href)
    bc.close()
    window.close()
  }, [])

  return (
    <p className="p-6 text-center text-sm text-zinc-600">
      Completing OpenStreetMap sign-in… You can close this window.
    </p>
  )
}
