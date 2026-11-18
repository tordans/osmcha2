import type { RouterHistory } from '@tanstack/react-router'

let lastActionWasTraversal = false

/** Remember whether the latest navigation was browser back/forward rather than a push or replace. */
export function trackHistoryTraversal(history: RouterHistory) {
  history.subscribe(({ action }) => {
    lastActionWasTraversal =
      action.type === 'BACK' || action.type === 'FORWARD' || action.type === 'GO'
  })
}

/** True while the current location was reached with browser back/forward. */
export function isHistoryTraversal() {
  return lastActionWasTraversal
}
