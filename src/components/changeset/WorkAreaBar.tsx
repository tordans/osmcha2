import clsx from 'clsx'
import { motion } from 'motion/react'
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { ActiveWorkArea, WorkArea } from '../../views/changesetWorkAreas.ts'
import { flyoutFrostedSurfaceClassName } from '../ui/flyout.ts'
import type { WorkAreaChanges } from './workAreaChanges.ts'

/** Critically damped: the pill settles on a tab without overshooting it. */
const PILL_SPRING = { type: 'spring' as const, damping: 36, stiffness: 320 }

const tabLayoutClassName =
  'inline-flex h-full flex-none items-center gap-1.5 px-2.5 text-sm font-medium whitespace-nowrap'

type TabKey = 'all' | number

type HighlightPill = { left: number; width: number; navWidth: number }

/**
 * Jump between the places a spread-out changeset touched. A pill slides to the
 * area in view and follows the pointer; its own copy of the labels is clipped
 * to the pill, so text turns white exactly where the pill covers it.
 */
export function WorkAreaBar({
  groups,
  active,
  onJump,
}: {
  groups: WorkAreaChanges[]
  active: ActiveWorkArea
  onJump: (area: WorkArea | null) => void
}) {
  const [hovered, setHovered] = useState<TabKey | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const tabRefs = useRef(new Map<TabKey, HTMLElement>())
  const [pill, setPill] = useState<HighlightPill | null>(null)
  const tabs = [
    { key: 'all' as TabKey, area: null, label: 'All', count: null },
    ...groups.flatMap(({ area, changes }) =>
      area
        ? [{ key: area.id as TabKey, area, label: `Area ${area.id}`, count: changes.length }]
        : [],
    ),
  ]
  const highlighted = hovered ?? active

  useLayoutEffect(
    function measureHighlightedTab() {
      function measure() {
        const nav = navRef.current
        const tab = highlighted == null ? null : tabRefs.current.get(highlighted)
        if (!nav || !tab) return
        // Offsets, not viewport rects: the bar scrolls sideways when it has many areas.
        const next = { left: tab.offsetLeft, width: tab.offsetWidth, navWidth: nav.scrollWidth }
        setPill((prev) =>
          prev &&
          prev.left === next.left &&
          prev.width === next.width &&
          prev.navWidth === next.navWidth
            ? prev
            : next,
        )
      }

      measure()

      const nav = navRef.current
      if (!nav) return
      const observer = new ResizeObserver(measure)
      observer.observe(nav)
      for (const tab of tabRefs.current.values()) observer.observe(tab)
      return function disconnectTabResizeObserver() {
        observer.disconnect()
      }
    },
    [highlighted, tabs.length],
  )

  return (
    <nav
      ref={navRef}
      aria-label="Work areas"
      className={clsx(
        'pointer-events-auto relative isolate flex h-11 max-w-full items-center overflow-x-auto rounded-lg p-1',
        flyoutFrostedSurfaceClassName,
      )}
      onMouseLeave={() => setHovered(null)}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          ref={(node) => {
            if (node) tabRefs.current.set(tab.key, node)
            else tabRefs.current.delete(tab.key)
          }}
          type="button"
          aria-pressed={active === tab.key}
          onClick={() => onJump(tab.area)}
          onMouseEnter={() => setHovered(tab.key)}
          className={clsx(
            tabLayoutClassName,
            'cursor-pointer touch-manipulation rounded-md text-zinc-700 select-none',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
          )}
        >
          <TabLabel label={tab.label} count={tab.count} />
        </button>
      ))}
      {pill ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute top-1 bottom-1 left-0 z-10 overflow-hidden rounded-md bg-fuchsia-600 shadow-md"
          initial={false}
          animate={{ x: pill.left, width: pill.width, opacity: highlighted == null ? 0 : 1 }}
          transition={PILL_SPRING}
        >
          <motion.div
            className="absolute top-0 left-0 flex h-full items-center"
            style={{ width: pill.navWidth }}
            initial={false}
            animate={{ x: -pill.left }}
            transition={PILL_SPRING}
          >
            {tabs.map((tab) => (
              <span key={tab.key} className={clsx(tabLayoutClassName, 'text-white')}>
                <TabLabel label={tab.label} count={tab.count} inverted />
              </span>
            ))}
          </motion.div>
        </motion.div>
      ) : null}
    </nav>
  )
}

function TabLabel({
  label,
  count,
  inverted = false,
}: {
  label: ReactNode
  count: number | null
  inverted?: boolean
}) {
  return (
    <>
      {label}
      {count != null ? (
        <span
          className={clsx(
            'rounded-md px-1.5 py-0.5 text-xs/5 font-medium tabular-nums',
            inverted ? 'bg-white/20 text-white' : 'bg-zinc-600/10 text-zinc-700',
          )}
        >
          {count}
        </span>
      ) : null}
    </>
  )
}
