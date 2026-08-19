import clsx from 'clsx'
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { PANE_NUDGE_PX } from './paneWidths.ts'

type PaneResizeHandleProps = {
  value: number
  min: number
  max: number
  onDragDelta: (delta: number) => void
  onReset: () => void
  'aria-label': string
}

export function PaneResizeHandle({
  value,
  min,
  max,
  onDragDelta,
  onReset,
  'aria-label': ariaLabel,
}: PaneResizeHandleProps) {
  const dragging = useRef(false)
  const lastX = useRef(0)
  const [active, setActive] = useState(false)

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    dragging.current = true
    lastX.current = event.clientX
    setActive(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return
    const delta = event.clientX - lastX.current
    lastX.current = event.clientX
    if (delta !== 0) onDragDelta(delta)
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return
    dragging.current = false
    setActive(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      onDragDelta(-PANE_NUDGE_PX)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      onDragDelta(PANE_NUDGE_PX)
    }
  }

  return (
    <div
      role="separator"
      aria-label={ariaLabel}
      aria-orientation="vertical"
      aria-valuenow={Math.round(value)}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={() => {
        dragging.current = false
        setActive(false)
      }}
      onDoubleClick={onReset}
      onKeyDown={onKeyDown}
      className={clsx(
        'group hidden w-3 shrink-0 cursor-col-resize touch-none items-stretch justify-center select-none min-[56rem]:flex',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          'h-full w-0.5 rounded-full transition-colors',
          active
            ? 'bg-zinc-400'
            : 'bg-transparent group-hover:bg-zinc-300 group-focus-visible:bg-zinc-300',
        )}
      />
    </div>
  )
}
