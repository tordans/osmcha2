import {
  animate,
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
  type RefObject,
} from 'react'
import { snapToMini } from './streetImageryPhotoSheet.ts'

const SHEET_SPRING = { type: 'spring', stiffness: 420, damping: 42 } as const

export type PhotoSheetBody = {
  /** On the header: the sheet keeps it in view when small. */
  headerRef: RefObject<HTMLDivElement | null>
  startDrag: (event: PointerEvent<HTMLElement>) => void
  /** Where the sheet starts on screen, once it has stopped moving. */
  panelTop: () => number | null
  /** Changes when the sheet has stopped at another stop. */
  settledMini: boolean
}

/**
 * The photo on phones: a sheet that leaves the map usable, open or down to its header. It moves with
 * a transform, so the viewer stays loaded and keeps its view while small.
 */
export function StreetImageryPhotoSheet({
  children,
}: {
  children: (body: PhotoSheetBody) => ReactNode
}) {
  const sheetRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const insetRef = useRef<HTMLDivElement>(null)
  const draggedRef = useRef(false)
  const [mini, setMini] = useState(false)
  const [settledMini, setSettledMini] = useState(false)
  const [miniOffset, setMiniOffset] = useState(0)
  const y = useMotionValue(0)
  const dragControls = useDragControls()
  const reduceMotion = useReducedMotion()

  useLayoutEffect(function measureMiniOffset() {
    const sheet = sheetRef.current
    const header = headerRef.current
    const inset = insetRef.current
    if (!sheet || !header || !inset) return
    function measure() {
      if (!sheet || !header || !inset) return
      const shownWhenSmall = header.offsetTop + header.offsetHeight + inset.offsetHeight
      setMiniOffset(Math.max(0, sheet.offsetHeight - shownWhenSmall))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(sheet)
    observer.observe(header)
    return function stopMeasuring() {
      observer.disconnect()
    }
  }, [])

  useEffect(
    function moveToStop() {
      const controls = animate(
        y,
        mini ? miniOffset : 0,
        reduceMotion ? { duration: 0 } : SHEET_SPRING,
      )
      void controls.then(() => setSettledMini(mini))
      return function stopMoving() {
        controls.stop()
      }
    },
    [y, mini, miniOffset, reduceMotion],
  )

  function onDragEnd(_event: unknown, info: PanInfo) {
    const next = snapToMini({ offset: y.get(), velocity: info.velocity.y, miniOffset })
    if (next !== mini) {
      setMini(next)
      return
    }
    // Same stop: the effect will not run, so settle back here.
    animate(y, mini ? miniOffset : 0, reduceMotion ? { duration: 0 } : SHEET_SPRING)
  }

  function onGripClick() {
    if (draggedRef.current) {
      draggedRef.current = false
      return
    }
    setMini(!mini)
  }

  function panelTop() {
    const sheet = sheetRef.current
    if (!sheet) return null
    return window.innerHeight - sheet.offsetHeight + (settledMini ? miniOffset : 0)
  }

  function startDrag(event: PointerEvent<HTMLElement>) {
    dragControls.start(event)
  }

  return (
    <motion.section
      ref={sheetRef}
      aria-label="Street-level photo"
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: miniOffset }}
      dragElastic={0.05}
      dragMomentum={false}
      onDragStart={() => {
        draggedRef.current = true
      }}
      onDragEnd={onDragEnd}
      style={{ y }}
      className="relative rounded-t-2xl bg-white shadow-lg ring-1 ring-zinc-950/10"
    >
      <button
        type="button"
        aria-expanded={!mini}
        aria-label={mini ? 'Show the photo' : 'Make the photo small'}
        onPointerDown={startDrag}
        onClick={onGripClick}
        className="flex h-6 w-full cursor-pointer touch-none items-center justify-center select-none"
      >
        <span aria-hidden className="h-1 w-10 rounded-full bg-zinc-300" />
      </button>
      {children({ headerRef, startDrag, panelTop, settledMini })}
      <div ref={insetRef} className="pb-[env(safe-area-inset-bottom)]" />
    </motion.section>
  )
}
