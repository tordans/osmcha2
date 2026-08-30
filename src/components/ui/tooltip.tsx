import clsx from 'clsx'
import {
  useId,
  useRef,
  type CSSProperties,
  type MouseEventHandler,
  type PointerEvent,
  type ReactNode,
} from 'react'

type TooltipAs = 'button' | 'span' | 'abbr'
type TooltipPlacement = 'bottom' | 'bottom-end'

type TooltipProps = {
  content: ReactNode
  children: ReactNode
  className?: string
  onClick?: MouseEventHandler<HTMLElement>
  href?: string
  target?: string
  rel?: string
  'aria-label'?: string
  /** `span`/`abbr` for non-interactive labels (valid inside links/buttons). */
  as?: TooltipAs
  /**
   * Default centers under the trigger. `bottom-end` grows left from the trigger’s
   * right edge from `min-[56rem]` (desktop split); stays centered in the mobile sheet.
   */
  placement?: TooltipPlacement
}

const panelPositionClassName = {
  bottom:
    'fixed [inset:auto] [top:calc(anchor(bottom)+0.35rem)] [left:anchor(center)] -translate-x-1/2',
  'bottom-end':
    'fixed [inset:auto] [top:calc(anchor(bottom)+0.35rem)] [left:anchor(center)] -translate-x-1/2 min-[56rem]:[left:auto] min-[56rem]:[right:anchor(right)] min-[56rem]:translate-x-0',
} as const

const panelArrowClassName = {
  bottom: 'before:left-1/2 before:-translate-x-1/2',
  'bottom-end':
    'before:left-1/2 before:-translate-x-1/2 min-[56rem]:before:right-1.5 min-[56rem]:before:left-auto min-[56rem]:before:translate-x-0',
} as const

const panelTryClassName = {
  bottom: '[position-try-fallbacks:flip-block,flip-inline]',
  'bottom-end':
    '[position-try-fallbacks:flip-block,flip-inline] min-[56rem]:[position-try-fallbacks:flip-block]',
} as const

const nativeInterestInvokers =
  typeof HTMLElement !== 'undefined' && 'interestForElement' in HTMLElement.prototype

/**
 * Tooltip on the browser top layer: `popover="hint"` + CSS anchor positioning.
 * Chromium also honors `interestfor` (hover/focus/long-press). Other browsers
 * get a small pointer/focus fallback that still uses `showPopover()`.
 * Enter/exit uses Tailwind `open:` / `starting:open:` so native `display`/`overlay`
 * can animate with `allow-discrete` (same idea as Motion chrome, without fighting
 * the popover top layer).
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
  placement = 'bottom',
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

  const isHelp = as === 'abbr' || (as === 'span' && !href && !onClick)
  const triggerClassName = clsx(
    'inline-flex touch-manipulation items-center select-none',
    href || onClick || as === 'button' ? 'cursor-pointer' : isHelp ? 'cursor-help' : null,
    as === 'abbr' && 'underline decoration-zinc-400 decoration-dotted underline-offset-2',
    '[interest-delay:0.2s_0.1s]',
    className,
  )
  const triggerAriaLabel =
    as === 'button' || href
      ? (ariaLabel ?? (typeof content === 'string' ? content : undefined))
      : ariaLabel

  const triggerProps = {
    interestfor: id,
    ...fallback,
    'aria-label': triggerAriaLabel,
    'aria-describedby': id,
    className: triggerClassName,
    style: triggerStyle,
  }

  const trigger = href ? (
    <a
      href={href}
      target={target}
      rel={rel}
      {...triggerProps}
      onClick={(event) => {
        hideTooltip()
        onClick?.(event)
      }}
    >
      {children}
    </a>
  ) : as === 'span' ? (
    <span {...triggerProps}>{children}</span>
  ) : as === 'abbr' ? (
    <abbr {...triggerProps}>{children}</abbr>
  ) : (
    <button
      type="button"
      {...triggerProps}
      onClick={(event) => {
        if (!nativeInterestInvokers) {
          const panel = panelRef.current
          if (panel?.matches(':popover-open')) hideTooltip()
          else showTooltip()
        }
        onClick?.(event)
      }}
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
          'm-0 w-max max-w-xs border-0 bg-zinc-950 px-2 py-1 text-left text-xs/4 whitespace-pre-line text-white',
          'rounded-md shadow-lg',
          "before:pointer-events-none before:absolute before:bottom-full before:border-x-4 before:border-b-4 before:border-x-transparent before:border-b-zinc-950 before:content-['']",
          panelArrowClassName[placement],
          panelPositionClassName[placement],
          panelTryClassName[placement],
          '[transition-behavior:allow-discrete]',
          'transition-[display,overlay,opacity,transform] duration-150 ease-out',
          'translate-y-1 scale-[0.96] opacity-0',
          'open:translate-y-0 open:scale-100 open:opacity-100',
          'starting:open:translate-y-1 starting:open:scale-[0.96] starting:open:opacity-0',
          'motion-reduce:transition-none',
        )}
        style={panelStyle}
      >
        {content}
      </div>
    </>
  )
}
