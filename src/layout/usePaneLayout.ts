import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { usePaneLayoutStore } from '../stores/paneLayoutStore.ts'
import { HANDLE_WIDTH, clampPreferredWidths } from './paneWidths.ts'

export const PaneAvailableContext = createContext(0)

export function usePaneLayout(hasReview: boolean) {
  const handleCount = hasReview ? 2 : 1
  const rowRef = useRef<HTMLDivElement>(null)
  const [available, setAvailable] = useState(0)
  const listWidth = usePaneLayoutStore((state) => state.listWidth)
  const reviewWidth = usePaneLayoutStore((state) => state.reviewWidth)

  useLayoutEffect(
    function observePaneRowWidth() {
      const row = rowRef.current
      if (!row) return

      function measurePaneBudget() {
        const paneRow = rowRef.current
        if (!paneRow) return
        setAvailable(paneRow.clientWidth - handleCount * HANDLE_WIDTH)
      }

      measurePaneBudget()
      const observer = new ResizeObserver(measurePaneBudget)
      observer.observe(row)
      return function disconnectPaneRowObserver() {
        observer.disconnect()
      }
    },
    [handleCount],
  )

  const displayed = clampPreferredWidths({
    available,
    list: listWidth,
    review: reviewWidth,
    hasReview,
  })

  const paneVars = {
    '--pane-list-width': `${displayed.list}px`,
    '--pane-review-width': `${displayed.review}px`,
  } as CSSProperties

  return { rowRef, available, displayed, paneVars }
}

export function useDisplayedPaneWidths(hasReview: boolean) {
  const available = useContext(PaneAvailableContext)
  const listWidth = usePaneLayoutStore((state) => state.listWidth)
  const reviewWidth = usePaneLayoutStore((state) => state.reviewWidth)
  const displayed = clampPreferredWidths({
    available,
    list: listWidth,
    review: reviewWidth,
    hasReview,
  })
  return { available, displayed }
}
