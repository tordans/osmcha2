export const LIST_DEFAULT = 288
export const LIST_MIN = 240
export const LIST_MAX = 480

export const REVIEW_DEFAULT = 384
export const REVIEW_MIN = 320
export const REVIEW_MAX = 640

export const MAP_MIN = 280
const MAIN_MIN = 320

export const HANDLE_WIDTH = 12
export const PANE_NUDGE_PX = 16

export type PaneSide = 'list' | 'review'

export type PreferredPaneWidths = {
  list: number
  review: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function finiteOr(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback
}

export function clampPane(value: number, min: number, max: number, fallback: number) {
  return clamp(finiteOr(value, fallback), min, max)
}

export function clampPreferredWidths({
  available,
  list,
  review,
  hasReview,
}: {
  available: number
  list: number
  review: number
  hasReview: boolean
}): PreferredPaneWidths {
  const listPref = clampPane(list, LIST_MIN, LIST_MAX, LIST_DEFAULT)
  const reviewPref = clampPane(review, REVIEW_MIN, REVIEW_MAX, REVIEW_DEFAULT)

  if (!Number.isFinite(available) || available <= 0) {
    return { list: listPref, review: reviewPref }
  }

  if (!hasReview) {
    const maxList = Math.max(LIST_MIN, available - MAIN_MIN)
    return { list: Math.min(listPref, maxList), review: reviewPref }
  }

  if (available >= listPref + reviewPref + MAP_MIN) {
    return { list: listPref, review: reviewPref }
  }

  const remaining = available - MAP_MIN
  if (remaining <= LIST_MIN + REVIEW_MIN) {
    return { list: LIST_MIN, review: REVIEW_MIN }
  }

  const listExtra = listPref - LIST_MIN
  const reviewExtra = reviewPref - REVIEW_MIN
  const totalExtra = listExtra + reviewExtra
  const leftover = remaining - LIST_MIN - REVIEW_MIN
  const listKeepExtra = totalExtra === 0 ? 0 : Math.round((leftover * listExtra) / totalExtra)
  const listDisplayed = LIST_MIN + listKeepExtra

  return {
    list: listDisplayed,
    review: remaining - listDisplayed,
  }
}

export function resizeSidePane({
  side,
  delta,
  available,
  list,
  review,
  hasReview,
  max,
}: {
  side: PaneSide
  delta: number
  available: number
  list: number
  review: number
  hasReview: boolean
  max?: number
}): number {
  const listMax = side === 'list' ? (max ?? LIST_MAX) : LIST_MAX
  const reviewMax = side === 'review' ? (max ?? REVIEW_MAX) : REVIEW_MAX
  const listPref = clampPane(list, LIST_MIN, listMax, LIST_DEFAULT)
  const reviewPref = clampPane(review, REVIEW_MIN, reviewMax, REVIEW_DEFAULT)

  if (side === 'review' && !hasReview) {
    return reviewPref
  }

  const sideMin = side === 'list' ? LIST_MIN : REVIEW_MIN
  const sideMax = side === 'list' ? listMax : reviewMax
  const current = side === 'list' ? listPref : reviewPref
  const far = side === 'list' ? (hasReview ? reviewPref : 0) : listPref
  const slackMin = hasReview ? MAP_MIN : MAIN_MIN
  const next = clamp(current + delta, sideMin, sideMax)

  if (!Number.isFinite(available) || available <= 0) {
    return next
  }

  const maxFit = available - far - slackMin
  if (next <= maxFit) {
    return next
  }

  // Preferred already does not fit (window shrink display-clamp). Do not write the
  // emergency width back; only allow shrinking the dragged pane.
  if (current > maxFit) {
    return delta >= 0 ? current : next
  }

  return Math.max(sideMin, maxFit)
}
