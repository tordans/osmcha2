import { useEffect } from 'react'

function publishAppHeight() {
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`)
}

export function useAppHeight() {
  useEffect(function subscribeToViewportHeight() {
    publishAppHeight()

    window.addEventListener('resize', publishAppHeight)
    window.addEventListener('orientationchange', publishAppHeight)
    window.visualViewport?.addEventListener('resize', publishAppHeight)

    return function unsubscribeFromViewportHeight() {
      window.removeEventListener('resize', publishAppHeight)
      window.removeEventListener('orientationchange', publishAppHeight)
      window.visualViewport?.removeEventListener('resize', publishAppHeight)
    }
  }, [])
}
