/** How much to add to `scrollTop` so `child` sits inside `parent` (viewport rects). */
export function scrollDeltaToReveal(
  parentTop: number,
  parentBottom: number,
  childTop: number,
  childBottom: number,
  padding = 8,
): number {
  if (childTop < parentTop + padding) return childTop - parentTop - padding
  if (childBottom > parentBottom - padding) return childBottom - parentBottom + padding
  return 0
}

/**
 * Scroll only `scroller` (not overflow:hidden ancestors). `scrollIntoView` often no-ops here.
 * `stickyTop` is chrome stuck to the top of the scroller that would cover the child.
 */
export function scrollChildIntoScroller(
  scroller: HTMLElement,
  child: HTMLElement,
  padding = 8,
  stickyTop = 0,
) {
  const parent = scroller.getBoundingClientRect()
  const rect = child.getBoundingClientRect()
  const delta = scrollDeltaToReveal(
    parent.top + stickyTop,
    parent.bottom,
    rect.top,
    rect.bottom,
    padding,
  )
  if (delta !== 0) scroller.scrollTop += delta
}

/** Px of sticky chrome at the top of the Changes scroller (phone sheet tabs); 0 on desktop. */
export function stickyTopOf(scroller: HTMLElement) {
  return Number.parseFloat(getComputedStyle(scroller).getPropertyValue('--changes-sticky-top')) || 0
}

export function changeRowDomId(type: string, id: number) {
  return `change-row-${type}-${id}`
}

export function workAreaSectionDomId(areaId: number) {
  return `work-area-${areaId}`
}

/** Bring a work area's section to the top of the Changes list; no-op while another tab is open. */
export function scrollChangesToWorkArea(areaId: number) {
  const section = document.getElementById(workAreaSectionDomId(areaId))
  const scroller = section?.closest('[data-changeset-changes-scroll]')
  if (!section || !(scroller instanceof HTMLElement)) return
  const delta =
    section.getBoundingClientRect().top -
    scroller.getBoundingClientRect().top -
    stickyTopOf(scroller)
  scroller.scrollBy({ top: delta, behavior: 'smooth' })
}
