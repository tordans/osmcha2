import { create } from 'zustand'

export type ChangesetHover = { type: string; id: number }

/** `focus`: also move DOM focus there, for moves of the review cursor. */
export type ListScrollTarget = ChangesetHover & { focus?: boolean }

interface ChangesetHoverStore {
  hover: ChangesetHover | null
  listScrollTarget: ListScrollTarget | null
  listScrollNonce: number
  actions: {
    setHover: (hover: ChangesetHover | null) => void
    requestListScroll: (target: ListScrollTarget) => void
    clearListScrollTarget: () => void
  }
}

function hoverEquals(a: ChangesetHover | null, b: ChangesetHover | null) {
  if (a === b) return true
  if (a == null || b == null) return false
  return a.type === b.type && a.id === b.id
}

const useChangesetHoverStore = create<ChangesetHoverStore>()((set) => ({
  hover: null,
  listScrollTarget: null,
  listScrollNonce: 0,
  actions: {
    setHover: (hover) => set((state) => (hoverEquals(state.hover, hover) ? state : { hover })),
    requestListScroll: (target) =>
      set((state) => ({
        listScrollTarget: target,
        listScrollNonce: state.listScrollNonce + 1,
      })),
    clearListScrollTarget: () => set({ listScrollTarget: null }),
  },
}))

export const useChangesetHover = () => useChangesetHoverStore((state) => state.hover)

export const useIsElementHovered = (type: string, id: number) =>
  useChangesetHoverStore((state) => state.hover?.type === type && state.hover?.id === id)

/** True while any of `elements` is hovered; re-renders only when that answer flips. */
export const useIsAnyElementHovered = (elements: readonly ChangesetHover[]) =>
  useChangesetHoverStore((state) => {
    const { hover } = state
    return (
      hover != null && elements.some((item) => item.type === hover.type && item.id === hover.id)
    )
  })

export const useListScrollTarget = () => useChangesetHoverStore((state) => state.listScrollTarget)

/** Re-renders only when this element becomes or stops being the scroll target. */
export const useIsListScrollTarget = (type: string, id: number) =>
  useChangesetHoverStore(
    (state) => state.listScrollTarget?.type === type && state.listScrollTarget.id === id,
  )

export const useListScrollNonce = () => useChangesetHoverStore((state) => state.listScrollNonce)

export const useChangesetHoverActions = () => useChangesetHoverStore((state) => state.actions)
