import { create } from 'zustand'

interface ReviewFocusStore {
  /**
   * The "Same tag changes" group under the review cursor, by the `node/123`-style key of its first
   * member. A cursor on a row is the URL `ref` instead; see `reviewCursorOf`.
   */
  groupCursorKey: string | null
  /** Changeset whose Post notes card scrolls into view once it renders; cleared after. */
  finishFocusRequest: number | null
  actions: {
    setGroupCursor: (key: string | null) => void
    requestFinishFocus: (changesetId: number) => void
    clearFinishFocusRequest: () => void
  }
}

/** Not persisted: kept apart from the notes store so cursor moves do not rewrite all drafts. */
const useReviewFocusStore = create<ReviewFocusStore>()((set) => ({
  groupCursorKey: null,
  finishFocusRequest: null,
  actions: {
    setGroupCursor: (key) => set({ groupCursorKey: key }),
    requestFinishFocus: (changesetId) => set({ finishFocusRequest: changesetId }),
    clearFinishFocusRequest: () =>
      set((state) => (state.finishFocusRequest == null ? state : { finishFocusRequest: null })),
  },
}))

export const useFinishFocusRequest = () => useReviewFocusStore((state) => state.finishFocusRequest)

export const useGroupCursorKey = () => useReviewFocusStore((state) => state.groupCursorKey)

/** Re-renders only when this group gets or loses the cursor. */
export const useIsGroupCursor = (key: string) =>
  useReviewFocusStore((state) => state.groupCursorKey === key)

export const useReviewFocusActions = () => useReviewFocusStore((state) => state.actions)

export function getReviewFocusActions() {
  return useReviewFocusStore.getState().actions
}

/** Read at keypress time: the review keys act on the cursor as it is now. */
export function getGroupCursorKey() {
  return useReviewFocusStore.getState().groupCursorKey
}

export function resetReviewFocusStoreForTests() {
  useReviewFocusStore.setState({ groupCursorKey: null, finishFocusRequest: null })
}
