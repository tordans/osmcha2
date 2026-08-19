let lastPointer = { x: 0, y: 0 }
let tracking = false

function trackPointer() {
  if (tracking || typeof window === 'undefined') return
  tracking = true
  window.addEventListener(
    'pointerdown',
    (event) => {
      lastPointer = { x: event.clientX, y: event.clientY }
    },
    true,
  )
}

trackPointer()

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function visibleTrigger(name: string) {
  const nodes = document.querySelectorAll(`[data-panel-origin="${name}"]`)
  for (const node of nodes) {
    if (!(node instanceof HTMLElement)) continue
    const box = node.getBoundingClientRect()
    if (box.width > 0 && box.height > 0) return box
  }
  return null
}

export type PanelOrigin = {
  x: number
  origin: string
}

/** Slide/scale origin for a main pane, from the trigger that opened it (or the last pointer). */
export function readPanelOrigin(name: string | null): PanelOrigin {
  const fallback: PanelOrigin = {
    x: name === 'filters' ? -40 : -16,
    origin: name === 'filters' ? '0% 10%' : '0% 0%',
  }
  if (!name || typeof document === 'undefined') return fallback

  const pane = document.querySelector('main')
  if (!(pane instanceof HTMLElement)) return fallback
  const paneBox = pane.getBoundingClientRect()
  if (paneBox.width === 0 || paneBox.height === 0) return fallback

  const trigger = visibleTrigger(name)
  const point = trigger
    ? { x: trigger.left + trigger.width / 2, y: trigger.top + trigger.height / 2 }
    : lastPointer

  const x = point.x - paneBox.left
  const y = point.y - paneBox.top
  return {
    x: clamp(point.x - paneBox.left, -120, 0),
    origin: `${clamp((x / paneBox.width) * 100, 0, 100)}% ${clamp((y / paneBox.height) * 100, 0, 100)}%`,
  }
}

export function panelOriginName(pathname: string): 'filters' | 'menu' | null {
  if (pathname === '/' || pathname.startsWith('/changesets/')) return null
  if (pathname === '/filters') return 'filters'
  return 'menu'
}
