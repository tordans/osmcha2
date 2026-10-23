import { create } from 'zustand'
import type { SheetPosition } from '../components/changeset/reviewSheetSnap.ts'

/** Px of the map the phone sheet covers at the stops where the map shows. */
type ReviewSheetInsets = { half: number; map: number }

interface ReviewSheetStore {
  position: SheetPosition
  insets: ReviewSheetInsets
  actions: {
    setPosition: (position: SheetPosition) => void
    setInsets: (insets: ReviewSheetInsets) => void
    reset: () => void
  }
}

const initialInsets: ReviewSheetInsets = { half: 0, map: 0 }

const useReviewSheetStore = create<ReviewSheetStore>()((set) => ({
  position: 'list',
  insets: initialInsets,
  actions: {
    setPosition: (position) => set((state) => (state.position === position ? state : { position })),
    setInsets: (insets) =>
      set((state) =>
        state.insets.half === insets.half && state.insets.map === insets.map ? state : { insets },
      ),
    reset: () => set({ position: 'list', insets: initialInsets }),
  },
}))

export const useReviewSheetPosition = () => useReviewSheetStore((state) => state.position)

export const useReviewSheetActions = () => useReviewSheetStore((state) => state.actions)

export const getReviewSheetPosition = () => useReviewSheetStore.getState().position

export const getReviewSheetInsets = () => useReviewSheetStore.getState().insets

export const getReviewSheetActions = () => useReviewSheetStore.getState().actions
