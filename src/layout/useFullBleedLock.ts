import { useEffect } from 'react'

export function useFullBleedLock(enabled: boolean) {
  useEffect(
    function lockViewportToAppHeight() {
      const html = document.documentElement
      const body = document.body
      html.classList.toggle('app-full-bleed', enabled)
      body.classList.toggle('app-full-bleed', enabled)
      return function unlockViewport() {
        html.classList.remove('app-full-bleed')
        body.classList.remove('app-full-bleed')
      }
    },
    [enabled],
  )
}
