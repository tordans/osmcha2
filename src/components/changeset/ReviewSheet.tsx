import clsx from 'clsx'
import {
  animate,
  AnimatePresence,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  type PanInfo,
} from 'motion/react'
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { useReviewSheetActions, useReviewSheetPosition } from '../../stores/review-sheet-store.ts'
import { moveReviewSheet } from '../../views/reviewCamera.ts'
import { MapIcon } from '../ui/icons.ts'
import {
  sheetCoveredHeight,
  sheetOffsets,
  snapSheetPosition,
  type SheetPosition,
} from './reviewSheetSnap.ts'

const SHEET_SPRING = { type: 'spring', stiffness: 420, damping: 42 } as const

type SheetLayout = { sheetHeight: number; peekHeight: number; cardHeight: number }

/**
 * Phone review sheet with three stops: list (covers the map), half, and map (a strip with
 * the change count). The sheet moves with a transform, so the list stays laid out and
 * scrolled to the selection while the map shows. Drag from the strip or the header only.
 */
export function ReviewSheet({
  summary,
  header,
  card,
  scrollerRef,
  children,
}: {
  /** Strip label, e.g. "12 changes · 3 comments". */
  summary: string
  /** Stays at the top; dragging here moves the sheet. */
  header: ReactNode
  /** Selected element, floating above the strip in the map position. */
  card: ReactNode
  scrollerRef: Ref<HTMLDivElement>
  /** Scroll content. */
  children: ReactNode
}) {
  const position = useReviewSheetPosition()
  const { setInsets } = useReviewSheetActions()
  const reduceMotion = useReducedMotion()
  const sheetRef = useRef<HTMLElement>(null)
  const stripRef = useRef<HTMLButtonElement>(null)
  const safeAreaRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const draggedRef = useRef(false)
  const dragFromRef = useRef<SheetPosition>('list')
  const [layout, setLayout] = useState<SheetLayout>({
    sheetHeight: 0,
    peekHeight: 0,
    cardHeight: 0,
  })
  const y = useMotionValue(0)
  const dragControls = useDragControls()
  const offsets = sheetOffsets(layout.sheetHeight, layout.peekHeight)
  const targetOffset = offsets[position]

  useLayoutEffect(
    function measureReviewSheet() {
      function measure() {
        const next: SheetLayout = {
          sheetHeight: sheetRef.current?.offsetHeight ?? 0,
          peekHeight:
            (stripRef.current?.offsetHeight ?? 0) + (safeAreaRef.current?.offsetHeight ?? 0),
          cardHeight: cardRef.current?.offsetHeight ?? 0,
        }
        setLayout((prev) =>
          prev.sheetHeight === next.sheetHeight &&
          prev.peekHeight === next.peekHeight &&
          prev.cardHeight === next.cardHeight
            ? prev
            : next,
        )
        // Camera moves pad by what covers the map; publish it for code outside React.
        const nextOffsets = sheetOffsets(next.sheetHeight, next.peekHeight)
        setInsets({
          half: sheetCoveredHeight('half', { ...next, offsets: nextOffsets }),
          map: sheetCoveredHeight('map', { ...next, offsets: nextOffsets }),
        })
      }

      measure()
      const observer = new ResizeObserver(measure)
      for (const node of [
        sheetRef.current,
        stripRef.current,
        safeAreaRef.current,
        cardRef.current,
      ]) {
        if (node) observer.observe(node)
      }
      return function disconnectReviewSheetObserver() {
        observer.disconnect()
      }
    },
    [setInsets],
  )

  useEffect(
    function animateSheetToPosition() {
      const controls = animate(y, targetOffset, reduceMotion ? { duration: 0 } : SHEET_SPRING)
      return function stopSheetAnimation() {
        controls.stop()
      }
    },
    [y, targetOffset, reduceMotion],
  )

  function startSheetDrag(event: PointerEvent<HTMLElement>) {
    // Portaled header content bubbles here through React; drag only from what is really inside.
    if (!(event.target instanceof Node) || !event.currentTarget.contains(event.target)) return
    draggedRef.current = false
    dragControls.start(event)
  }

  function onDragStart() {
    draggedRef.current = true
    dragFromRef.current = position
  }

  function onDragEnd(_event: unknown, info: PanInfo) {
    const next = snapSheetPosition({
      offset: y.get(),
      velocity: info.velocity.y,
      from: dragFromRef.current,
      offsets,
    })
    moveReviewSheet(next)
    // Same stop: the position effect will not run, so settle back here.
    if (next === position) {
      animate(
        y,
        offsets[next],
        reduceMotion ? { duration: 0 } : { ...SHEET_SPRING, velocity: info.velocity.y },
      )
    }
  }

  function onStripClick() {
    if (draggedRef.current) {
      draggedRef.current = false
      return
    }
    moveReviewSheet(position === 'list' ? 'map' : 'list')
  }

  return (
    <>
      <motion.section
        ref={sheetRef}
        aria-label="Review"
        style={{ y }}
        drag="y"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: offsets.map }}
        dragElastic={0.08}
        dragMomentum={false}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className={clsx(
          // Below the floating "List" button (44px + gap), so leaving the changeset stays one tap.
          '@container/review absolute inset-x-0 top-[calc(max(0.75rem,env(safe-area-inset-top))+3.25rem)] bottom-0 z-30 flex min-h-0 flex-col',
          'rounded-t-xl bg-white shadow-[0_-4px_16px_rgb(24_24_27_/_0.12)]',
        )}
      >
        <div ref={cardRef} className="pointer-events-none absolute inset-x-0 bottom-full">
          {card ? (
            <div
              className={clsx(
                'px-3 pb-2 transition-opacity duration-200',
                position === 'map' ? 'pointer-events-auto opacity-100' : 'invisible opacity-0',
              )}
            >
              {card}
            </div>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-xl">
          <div onPointerDown={startSheetDrag} className="shrink-0 touch-none">
            <button
              ref={stripRef}
              type="button"
              aria-expanded={position !== 'map'}
              aria-label={position === 'list' ? 'Show map' : 'Show review list'}
              onClick={onStripClick}
              className="flex h-14 w-full cursor-pointer touch-none flex-col items-center justify-center gap-1.5 select-none"
            >
              <span aria-hidden className="h-1 w-10 rounded-full bg-zinc-300" />
              <span className="text-sm font-medium text-zinc-700">{summary}</span>
            </button>
            <div
              className={clsx(
                'transition-opacity duration-200',
                position === 'map' && 'pointer-events-none opacity-0',
              )}
            >
              {header}
            </div>
          </div>

          <div
            ref={scrollerRef}
            data-changeset-changes-scroll
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain [--changes-sticky-top:44px]"
          >
            {children}
            {/* Room for the Map pill, then the home indicator. */}
            <div aria-hidden className="h-16" />
            <div ref={safeAreaRef} aria-hidden className="h-[env(safe-area-inset-bottom)]" />
          </div>
        </div>
      </motion.section>

      <AnimatePresence>
        {position === 'list' ? (
          <motion.div
            key="map-pill"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex justify-center"
          >
            <button
              type="button"
              aria-label="Show map"
              onClick={() => moveReviewSheet('map')}
              className="pointer-events-auto flex min-h-11 cursor-pointer touch-manipulation items-center gap-2 rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white shadow-lg select-none active:bg-zinc-700"
            >
              Map
              <MapIcon className="size-4" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
