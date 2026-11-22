import clsx from 'clsx'
import {
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type MouseEvent,
  type MouseEventHandler,
  type PointerEvent,
  type ReactNode,
} from 'react'

type TooltipAs = 'button' | 'span' | 'abbr'
type TooltipPlacement = 'bottom' | 'bottom-end' | 'bottom-right'

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
   * `bottom-right` grows left from the trigger's right edge at every width, for triggers at the
   * right edge of the screen.
   */
  placement?: TooltipPlacement
}

/**
 * `position-area` + `anchor-center`, not `left: anchor(center)` + translate: the browser checks
 * overflow without transforms, so a translated tooltip near the right edge flipped to the wrong side.
 * With `span-all` it stays centered under the trigger and slides back inside the screen instead.
 */
const panelPositionClassName = {
  bottom:
    'fixed [inset:auto] mt-[0.35rem] [position-area:bottom_span-all] [justify-self:anchor-center]',
  'bottom-end':
    'fixed [inset:auto] mt-[0.35rem] [position-area:bottom_span-all] [justify-self:anchor-center] min-[56rem]:[position-area:bottom_span-left] min-[56rem]:[justify-self:end]',
  'bottom-right':
    'fixed [inset:auto] mt-[0.35rem] [position-area:bottom_span-left] [justify-self:end]',
} as const

const panelArrowClassName = {
  bottom: 'before:left-1/2 before:-translate-x-1/2',
  'bottom-end':
    'before:left-1/2 before:-translate-x-1/2 min-[56rem]:before:right-1.5 min-[56rem]:before:left-auto min-[56rem]:before:translate-x-0',
  'bottom-right': 'before:right-1.5',
} as const

const panelTryClassName = '[position-try-fallbacks:flip-block]'

/** Hold this long on a touch screen to show a tooltip without triggering the control. */
const LONG_PRESS_MS = 450
/** A finger that moves further than this is scrolling, not holding. */
const LONG_PRESS_SLOP_PX = 10

/** Controls a tap on a help-only trigger must leave alone (a button inside it, a link around it). */
const INTERACTIVE_SELECTOR = 'a[href],button,input,select,textarea,label,summary,[role="button"]'

function isTouchPointer(pointerType: string) {
  return pointerType === 'touch' || pointerType === 'pen'
}

/**
 * On a touch-only screen the native `interestfor` closes the hint as the finger lifts, so the touch
 * handling below owns it there.
 */
const nativeInterestInvokers =
  typeof HTMLElement !== 'undefined' &&
  'interestForElement' in HTMLElement.prototype &&
  !window.matchMedia('(hover: none)').matches

/**
 * Tooltip on the browser top layer: `popover="hint"` + CSS anchor positioning.
 * Chromium also honors `interestfor` (hover/focus/long-press). Other browsers
 * get a small pointer/focus fallback that still uses `showPopover()`.
 * Touch, everywhere: a long press shows the tooltip without running the control, and a tap on a
 * help-only trigger (no action of its own, or a disabled control inside) shows it too.
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

  const triggerRef = useRef<HTMLElement | null>(null)
  const pointerTypeRef = useRef<string>('mouse')
  const longPressRef = useRef<{ timer: number; x: number; y: number } | null>(null)
  const suppressClickRef = useRef(false)
  const dismissRef = useRef<(() => void) | null>(null)

  useEffect(
    () => () => {
      if (longPressRef.current) window.clearTimeout(longPressRef.current.timer)
      dismissRef.current?.()
    },
    [],
  )

  function showTooltip() {
    const panel = panelRef.current
    if (!panel || panel.matches(':popover-open')) return
    panel.showPopover()
  }

  function hideTooltip() {
    dismissRef.current?.()
    const panel = panelRef.current
    if (!panel?.matches(':popover-open')) return
    panel.hidePopover()
  }

  /**
   * Touch screens have no hover. A tooltip opened by touch stays until the next touch elsewhere or a
   * scroll; Safari treats `popover="hint"` as manual, so this does the light dismiss itself.
   */
  function showTooltipForTouch() {
    showTooltip()
    if (dismissRef.current) return
    function onOutside(event: Event) {
      const target = event.target as Node | null
      if (target && triggerRef.current?.contains(target)) return
      hideTooltip()
    }
    document.addEventListener('pointerdown', onOutside, true)
    window.addEventListener('scroll', onOutside, true)
    dismissRef.current = () => {
      document.removeEventListener('pointerdown', onOutside, true)
      window.removeEventListener('scroll', onOutside, true)
      dismissRef.current = null
    }
  }

  function toggleTooltipForTouch() {
    if (panelRef.current?.matches(':popover-open')) hideTooltip()
    else showTooltipForTouch()
  }

  function cancelLongPress() {
    if (!longPressRef.current) return
    window.clearTimeout(longPressRef.current.timer)
    longPressRef.current = null
  }

  const helpOnly = !href && !onClick

  /** A tap on the trigger itself, not on a working control inside it or around it. */
  function isPlainTap(event: MouseEvent<HTMLElement>) {
    const trigger = event.currentTarget
    const control = (event.target as Element).closest(INTERACTIVE_SELECTOR)
    if (control && control !== trigger && trigger.contains(control)) {
      return control.getAttribute('aria-disabled') === 'true' || control.matches(':disabled')
    }
    return !trigger.parentElement?.closest(INTERACTIVE_SELECTOR)
  }

  const touchHandlers = {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      pointerTypeRef.current = event.pointerType
      suppressClickRef.current = false
      if (!isTouchPointer(event.pointerType)) return
      cancelLongPress()
      longPressRef.current = {
        x: event.clientX,
        y: event.clientY,
        timer: window.setTimeout(() => {
          longPressRef.current = null
          suppressClickRef.current = true
          showTooltipForTouch()
        }, LONG_PRESS_MS),
      }
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      const press = longPressRef.current
      if (!press) return
      if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > LONG_PRESS_SLOP_PX) {
        cancelLongPress()
      }
    },
    onPointerUp: cancelLongPress,
    onPointerCancel: cancelLongPress,
    onContextMenu: (event: MouseEvent<HTMLElement>) => {
      // Android opens the context menu on a long press; the tooltip is what was asked for.
      if (isTouchPointer(pointerTypeRef.current)) event.preventDefault()
    },
    onClickCapture: (event: MouseEvent<HTMLElement>) => {
      // A long press showed the tooltip. The click that ends it must not also run the control.
      if (!suppressClickRef.current) return
      suppressClickRef.current = false
      event.preventDefault()
      event.stopPropagation()
      // Chromium's own interest handling closes the hint when the finger lifts. Keep it open.
      showTooltipForTouch()
    },
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
        // A tap focuses the button on Android; that is a tap on the control, not a request for help.
        onFocus: () => {
          if (!isTouchPointer(pointerTypeRef.current)) showTooltip()
        },
        onBlur: hideTooltip,
      }

  /** Touch: a tap on a help-only trigger shows its text, since it has nothing else to do. */
  function handleHelpTap(event: MouseEvent<HTMLElement>) {
    if (!helpOnly || !isTouchPointer(pointerTypeRef.current)) return
    if (!isPlainTap(event)) return
    toggleTooltipForTouch()
  }

  const isHelp = as === 'abbr' || (as === 'span' && !href && !onClick)
  const triggerClassName = clsx(
    'inline-flex touch-manipulation items-center select-none [-webkit-touch-callout:none]',
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
    ref: (element: HTMLElement | null) => {
      triggerRef.current = element
    },
    interestfor: nativeInterestInvokers ? id : undefined,
    ...touchHandlers,
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
    <span {...triggerProps} onClick={handleHelpTap}>
      {children}
    </span>
  ) : as === 'abbr' ? (
    <abbr {...triggerProps} onClick={handleHelpTap}>
      {children}
    </abbr>
  ) : (
    <button
      type="button"
      {...triggerProps}
      onClick={(event) => {
        if (helpOnly) {
          if (isTouchPointer(pointerTypeRef.current)) toggleTooltipForTouch()
          else if (!nativeInterestInvokers) {
            const panel = panelRef.current
            if (panel?.matches(':popover-open')) hideTooltip()
            else showTooltip()
          }
          return
        }
        hideTooltip()
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
          'm-0 w-max max-w-xs border-0 bg-zinc-950 px-2 py-1 text-left font-sans text-xs/4 whitespace-pre-line text-white',
          'rounded-md shadow-lg',
          "before:pointer-events-none before:absolute before:bottom-full before:border-x-4 before:border-b-4 before:border-x-transparent before:border-b-zinc-950 before:content-['']",
          panelArrowClassName[placement],
          panelPositionClassName[placement],
          panelTryClassName,
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
