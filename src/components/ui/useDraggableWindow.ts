import { useState, type CSSProperties, type PointerEvent } from 'react'

/** A window may leave the screen until only this share of it shows. */
const MIN_VISIBLE_SHARE = 0.2
/** Where it opens, centred, until it is moved. */
const OPEN_TOP_PX = 64

type Position = { left: number; top: number }
type Size = { width: number; height: number }

/**
 * Keeps a share of the window on screen. Never over the top: the header up there is what moves it.
 */
export function clampWindowPosition({ left, top }: Position, window: Size, screen: Size): Position {
  return {
    left: Math.min(
      screen.width - window.width * MIN_VISIBLE_SHARE,
      Math.max(-window.width * (1 - MIN_VISIBLE_SHARE), left),
    ),
    top: Math.min(screen.height - window.height * MIN_VISIBLE_SHARE, Math.max(0, top)),
  }
}

function windowBox(handle: HTMLElement) {
  return handle.closest('[data-draggable-window]')?.getBoundingClientRect()
}

/**
 * A `fixed` element marked `data-draggable-window` that its handle moves. It keeps its place until
 * the page goes.
 */
export function useDraggableWindow() {
  const [drag, setDrag] = useState<{ x: number; y: number; start: Position } | null>(null)
  const [position, setPosition] = useState<Position | null>(null)

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    const box = windowBox(event.currentTarget)
    if (!box || event.button !== 0 || (event.target as HTMLElement).closest('button, a')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setDrag({ x: event.clientX, y: event.clientY, start: { left: box.left, top: box.top } })
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const box = windowBox(event.currentTarget)
    if (!drag || !box) return
    setPosition(
      clampWindowPosition(
        {
          left: drag.start.left + event.clientX - drag.x,
          top: drag.start.top + event.clientY - drag.y,
        },
        box,
        {
          width: document.documentElement.clientWidth,
          height: document.documentElement.clientHeight,
        },
      ),
    )
  }

  function endDrag() {
    setDrag(null)
  }

  const style: CSSProperties = position ?? {
    left: '50%',
    top: OPEN_TOP_PX,
    transform: 'translateX(-50%)',
  }

  return {
    style,
    dragHandle: { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag },
  }
}
