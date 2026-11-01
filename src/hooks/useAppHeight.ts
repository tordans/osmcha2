import { useEffect } from 'react'

const TEXT_ENTRY_SELECTOR = 'input, textarea, select, [contenteditable="true"]'

/**
 * Whether a phone's keyboard is up. Embedded iOS browsers shrink `innerHeight` by the keyboard and
 * also push the page up to reveal the field, so that following that height leaves the app cut off
 * at the top with an empty area above the keyboard.
 */
export function keyboardMayBeOpen(activeElement: Element | null, coarsePointer: boolean) {
  return coarsePointer && activeElement?.matches(TEXT_ENTRY_SELECTOR) === true
}

function publishAppHeight() {
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches
  // The app keeps its height and the keyboard lies over it. The field's blur measures again.
  if (keyboardMayBeOpen(document.activeElement, coarsePointer)) return
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`)
  // iOS can leave the page pushed up after the keyboard; a full-bleed app has nothing to scroll to.
  if (document.documentElement.classList.contains('app-full-bleed') && window.scrollY !== 0) {
    window.scrollTo(0, 0)
  }
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
