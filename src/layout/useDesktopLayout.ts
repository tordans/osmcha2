import { useSyncExternalStore } from 'react'

/** Matches the shell `min-[56rem]` split between list and map. */
const DESKTOP_MQ = '(min-width: 56rem)'

let desktopMedia: MediaQueryList | undefined

/** One shared query list instead of a new `matchMedia` call on every read. */
function getDesktopMedia() {
  desktopMedia ??= window.matchMedia(DESKTOP_MQ)
  return desktopMedia
}

function subscribeDesktopLayout(onStoreChange: () => void) {
  const media = getDesktopMedia()
  media.addEventListener('change', onStoreChange)
  return function unsubscribeDesktopLayout() {
    media.removeEventListener('change', onStoreChange)
  }
}

function getDesktopLayoutSnapshot() {
  return getDesktopMedia().matches
}

/** Non-reactive read for event handlers and camera code outside render. */
export function isDesktopLayout() {
  return getDesktopLayoutSnapshot()
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
