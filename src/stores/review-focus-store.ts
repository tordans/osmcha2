import { create } from 'zustand'

type FocusedObject = { changesetId: number; type: string; id: number }

interface ReviewFocusStore {
  focusedObject: FocusedObject | null
  /** Changeset whose Post notes card scrolls into view once it renders; cleared after. */
  finishFocusRequest: number | null
  actions: {
    setFocusedObject: (focused: FocusedObject | null) => void
    requestFinishFocus: (changesetId: number) => void
    clearFinishFocusRequest: () => void
  }
}

/** Not persisted: kept apart from the notes store so focus changes do not rewrite all drafts. */
const useReviewFocusStore = create<ReviewFocusStore>()((set) => ({
  focusedObject: null,
  finishFocusRequest: null,
  actions: {
    setFocusedObject: (focused) => set({ focusedObject: focused }),
    requestFinishFocus: (changesetId) => set({ finishFocusRequest: changesetId }),
    clearFinishFocusRequest: () =>
      set((state) => (state.finishFocusRequest == null ? state : { finishFocusRequest: null })),
  },
}))

export const useFinishFocusRequest = () => useReviewFocusStore((state) => state.finishFocusRequest)

export const useReviewFocusActions = () => useReviewFocusStore((state) => state.actions)

export function getReviewFocusActions() {
  return useReviewFocusStore.getState().actions
}

/** Read at keypress time so the Changes list does not re-render on every row focus. */
export function getFocusedObject() {
  return useReviewFocusStore.getState().focusedObject
}

export function resetReviewFocusStoreForTests() {
  useReviewFocusStore.setState({ focusedObject: null, finishFocusRequest: null })
}
