import clsx from 'clsx'
import {
  useId,
  useRef,
  type CSSProperties,
  type MouseEventHandler,
  type PointerEvent,
  type ReactNode,
} from 'react'

type TooltipProps = {
  content: string
  children: ReactNode
  className?: string
  onClick?: MouseEventHandler<HTMLButtonElement>
  'aria-label'?: string
}

const nativeInterestInvokers =
  typeof HTMLElement !== 'undefined' && 'interestForElement' in HTMLElement.prototype

/**
 * Tooltip on the browser top layer: `popover="hint"` + CSS anchor positioning.
 * Chromium also honors `interestfor` (hover/focus/long-press). Other browsers
 * get a small pointer/focus fallback that still uses `showPopover()`.
 */
export function Tooltip({
  content,
  children,
  className,
  onClick,
  'aria-label': ariaLabel,
}: TooltipProps) {
  const reactId = useId()
  const id = `tooltip-${reactId.replaceAll(':', '')}`
  const anchor = `--${id}`
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerStyle = { anchorName: anchor } as CSSProperties
  const panelStyle = { positionAnchor: anchor } as CSSProperties

  function showTooltip() {
    const panel = panelRef.current
    if (!panel || panel.matches(':popover-open')) return
    panel.showPopover()
  }

  function hideTooltip() {
    const panel = panelRef.current
    if (!panel?.matches(':popover-open')) return
    panel.hidePopover()
  }

  const fallback = nativeInterestInvokers
    ? undefined
    : {
        onPointerEnter: (event: PointerEvent<HTMLButtonElement>) => {
          if (event.pointerType === 'mouse') showTooltip()
        },
        onPointerLeave: (event: PointerEvent<HTMLButtonElement>) => {
          if (event.pointerType === 'mouse') hideTooltip()
        },
        onFocus: showTooltip,
        onBlur: hideTooltip,
      }

  return (
    <>
      <button
        type="button"
        {...{ interestfor: id }}
        {...fallback}
        onClick={(event) => {
          if (!nativeInterestInvokers) {
            const panel = panelRef.current
            if (panel?.matches(':popover-open')) hideTooltip()
            else showTooltip()
          }
          onClick?.(event)
        }}
        aria-label={ariaLabel ?? content}
        aria-describedby={id}
        className={clsx(
          'inline-flex touch-manipulation items-center select-none',
          onClick ? 'cursor-pointer' : 'cursor-help',
          '[interest-delay:0.2s_0.1s]',
          className,
        )}
        style={triggerStyle}
      >
        {children}
      </button>
      <div
        ref={panelRef}
        id={id}
        popover="hint"
        role="tooltip"
        className={clsx(
          'm-0 max-w-xs border-0 bg-zinc-950 px-2 py-1.5 text-xs/5 text-white',
          'rounded-md shadow-lg',
          'fixed [inset:auto] [top:calc(anchor(bottom)+0.35rem)] [left:anchor(center)] -translate-x-1/2',
          '[position-try-fallbacks:flip-block]',
        )}
        style={panelStyle}
      >
        {content}
      </div>
    </>
  )
}
