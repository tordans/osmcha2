import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { useListPaneOpen } from '../stores/list-pane-store.ts'
import { usePaneLayoutStore } from '../stores/paneLayoutStore.ts'
import { HANDLE_WIDTH, clampPreferredWidths } from './paneWidths.ts'

export const PaneAvailableContext = createContext(0)

export function usePaneLayout(hasReview: boolean) {
  const hasList = useListPaneOpen()
  const handleCount = (hasList ? 1 : 0) + (hasReview ? 1 : 0)
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

  const displayedOpen = clampPreferredWidths({
    available,
    list: listWidth,
    review: reviewWidth,
    hasReview,
    hasList: true,
  })
  const displayed = hasList
    ? displayedOpen
    : clampPreferredWidths({
        available,
        list: listWidth,
        review: reviewWidth,
        hasReview,
        hasList: false,
      })

  const paneVars = {
    '--pane-list-width': `${displayedOpen.list}px`,
    '--pane-list-slot-width': `${displayedOpen.list + HANDLE_WIDTH}px`,
    '--pane-review-width': `${displayed.review}px`,
  } as CSSProperties

  return { rowRef, available, displayed, paneVars }
}

export function useDisplayedPaneWidths(hasReview: boolean) {
  const available = useContext(PaneAvailableContext)
  const hasList = useListPaneOpen()
  const listWidth = usePaneLayoutStore((state) => state.listWidth)
  const reviewWidth = usePaneLayoutStore((state) => state.reviewWidth)
  const displayed = clampPreferredWidths({
    available,
    list: listWidth,
    review: reviewWidth,
    hasReview,
    hasList,
  })
  return { available, displayed }
}
