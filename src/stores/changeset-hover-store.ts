import { create } from 'zustand'

export type ChangesetHover = { type: string; id: number }

interface ChangesetHoverStore {
  hover: ChangesetHover | null
  listScrollTarget: ChangesetHover | null
  listScrollNonce: number
  actions: {
    setHover: (hover: ChangesetHover | null) => void
    requestListScroll: (target: ChangesetHover) => void
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
  },
}))

export const useChangesetHover = () => useChangesetHoverStore((state) => state.hover)

export const useIsElementHovered = (type: string, id: number) =>
  useChangesetHoverStore((state) => state.hover?.type === type && state.hover?.id === id)

export const useListScrollTarget = () => useChangesetHoverStore((state) => state.listScrollTarget)

export const useListScrollNonce = () => useChangesetHoverStore((state) => state.listScrollNonce)

export const useChangesetHoverActions = () => useChangesetHoverStore((state) => state.actions)
