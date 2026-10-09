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

/** Scroll only `scroller` (not overflow:hidden ancestors). `scrollIntoView` often no-ops here. */
export function scrollChildIntoScroller(scroller: HTMLElement, child: HTMLElement, padding = 8) {
  const parent = scroller.getBoundingClientRect()
  const rect = child.getBoundingClientRect()
  const delta = scrollDeltaToReveal(parent.top, parent.bottom, rect.top, rect.bottom, padding)
  if (delta !== 0) scroller.scrollTop += delta
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
  const delta = section.getBoundingClientRect().top - scroller.getBoundingClientRect().top
  scroller.scrollBy({ top: delta, behavior: 'smooth' })
}
