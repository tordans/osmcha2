import { useSyncExternalStore } from 'react'

/** Matches the shell `min-[56rem]` split between list and map. */
const DESKTOP_MQ = '(min-width: 56rem)'

function subscribeDesktopLayout(onStoreChange: () => void) {
  const media = window.matchMedia(DESKTOP_MQ)
  media.addEventListener('change', onStoreChange)
  return function unsubscribeDesktopLayout() {
    media.removeEventListener('change', onStoreChange)
  }
}

function getDesktopLayoutSnapshot() {
  return window.matchMedia(DESKTOP_MQ).matches
}

function getDesktopLayoutServerSnapshot() {
  return true
}

export function useDesktopLayout() {
  return useSyncExternalStore(
    subscribeDesktopLayout,
    getDesktopLayoutSnapshot,
    getDesktopLayoutServerSnapshot,
  )
}
