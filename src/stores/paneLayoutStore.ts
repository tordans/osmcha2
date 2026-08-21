import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  LIST_DEFAULT,
  LIST_MAX,
  LIST_MIN,
  REVIEW_DEFAULT,
  REVIEW_MAX,
  REVIEW_MIN,
  clampPane,
} from '../layout/paneWidths.ts'

const persistedPaneLayoutSchema = z.object({
  listWidth: z.number(),
  reviewWidth: z.number(),
})

interface PaneLayoutState {
  listWidth: number
  reviewWidth: number
  setListWidth: (width: number) => void
  setReviewWidth: (width: number) => void
  resetListWidth: () => void
  resetReviewWidth: () => void
}

export const usePaneLayoutStore = create<PaneLayoutState>()(
  persist(
    (set) => ({
      listWidth: LIST_DEFAULT,
      reviewWidth: REVIEW_DEFAULT,
      setListWidth: (width) =>
        set({ listWidth: clampPane(width, LIST_MIN, LIST_MAX, LIST_DEFAULT) }),
      setReviewWidth: (width) =>
        set({ reviewWidth: clampPane(width, REVIEW_MIN, REVIEW_MAX, REVIEW_DEFAULT) }),
      resetListWidth: () => set({ listWidth: LIST_DEFAULT }),
      resetReviewWidth: () => set({ reviewWidth: REVIEW_DEFAULT }),
    }),
    {
      name: 'pane-layout',
      partialize: (state) => ({
        listWidth: state.listWidth,
        reviewWidth: state.reviewWidth,
      }),
      merge: (persistedState, currentState) => {
        const parsed = persistedPaneLayoutSchema.safeParse(persistedState)
        if (!parsed.success) return currentState
        return {
          ...currentState,
          listWidth: clampPane(parsed.data.listWidth, LIST_MIN, LIST_MAX, LIST_DEFAULT),
          reviewWidth: clampPane(parsed.data.reviewWidth, REVIEW_MIN, REVIEW_MAX, REVIEW_DEFAULT),
        }
      },
    },
  ),
)
