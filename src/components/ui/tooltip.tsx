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
  onClick?: MouseEventHandler<HTMLElement>
  href?: string
  target?: string
  rel?: string
  'aria-label'?: string
  /** `span` for non-interactive labels (valid inside links/buttons). */
  as?: 'button' | 'span'
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
  href,
  target,
  rel,
  'aria-label': ariaLabel,
  as = 'button',
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
        onPointerEnter: (event: PointerEvent<HTMLElement>) => {
          if (event.pointerType === 'mouse') showTooltip()
        },
        onPointerLeave: (event: PointerEvent<HTMLElement>) => {
          if (event.pointerType === 'mouse') hideTooltip()
        },
        onFocus: showTooltip,
        onBlur: hideTooltip,
      }

  const triggerClassName = clsx(
    'inline-flex touch-manipulation items-center select-none',
    href || onClick ? 'cursor-pointer' : 'cursor-help',
    '[interest-delay:0.2s_0.1s]',
    className,
  )
  const triggerAriaLabel = as === 'span' ? ariaLabel : (ariaLabel ?? content)

  const trigger = href ? (
    <a
      href={href}
      target={target}
      rel={rel}
      {...{ interestfor: id }}
      {...fallback}
      onClick={(event) => {
        hideTooltip()
        onClick?.(event)
      }}
      aria-label={triggerAriaLabel}
      aria-describedby={id}
      className={triggerClassName}
      style={triggerStyle}
    >
      {children}
    </a>
  ) : as === 'span' ? (
    <span
      {...{ interestfor: id }}
      {...fallback}
      aria-label={triggerAriaLabel}
      aria-describedby={id}
      className={triggerClassName}
      style={triggerStyle}
    >
      {children}
    </span>
  ) : (
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
      aria-label={triggerAriaLabel}
      aria-describedby={id}
      className={triggerClassName}
      style={triggerStyle}
    >
      {children}
    </button>
  )

  return (
    <>
      {trigger}
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
