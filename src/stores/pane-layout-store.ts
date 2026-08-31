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

interface PaneLayoutStore {
  listWidth: number
  reviewWidth: number
  actions: {
    setListWidth: (width: number) => void
    setReviewWidth: (width: number) => void
    resetListWidth: () => void
    resetReviewWidth: () => void
  }
}

const usePaneLayoutStore = create<PaneLayoutStore>()(
  persist(
    (set) => ({
      listWidth: LIST_DEFAULT,
      reviewWidth: REVIEW_DEFAULT,
      actions: {
        setListWidth: (width) =>
          set({ listWidth: clampPane(width, LIST_MIN, LIST_MAX, LIST_DEFAULT) }),
        setReviewWidth: (width) =>
          set({ reviewWidth: clampPane(width, REVIEW_MIN, REVIEW_MAX, REVIEW_DEFAULT) }),
        resetListWidth: () => set({ listWidth: LIST_DEFAULT }),
        resetReviewWidth: () => set({ reviewWidth: REVIEW_DEFAULT }),
      },
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

export const useListWidth = () => usePaneLayoutStore((state) => state.listWidth)

export const useReviewWidth = () => usePaneLayoutStore((state) => state.reviewWidth)

export const usePaneLayoutActions = () => usePaneLayoutStore((state) => state.actions)

export function getListWidth() {
  return usePaneLayoutStore.getState().listWidth
}

export function getReviewWidth() {
  return usePaneLayoutStore.getState().reviewWidth
}

export function getPaneLayoutActions() {
  return usePaneLayoutStore.getState().actions
}
