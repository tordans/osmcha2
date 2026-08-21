import { useMatch } from '@tanstack/react-router'
import { create } from 'zustand'

interface ListPaneStore {
  open: boolean
  actions: {
    collapse: () => void
    expand: () => void
  }
}

function isChangesetPath(pathname: string) {
  return pathname.startsWith('/changesets/')
}

/** Closed on changeset URLs so a deep link focuses the map; otherwise open. */
export function defaultListPaneOpen(pathname: string) {
  return !isChangesetPath(pathname)
}

/** Collapse is only allowed while a changeset is selected. */
export function effectiveListPaneOpen(pathname: string, storedOpen: boolean) {
  return isChangesetPath(pathname) ? storedOpen : true
}

function initialListPaneOpen() {
  if (typeof window === 'undefined') return true
  return defaultListPaneOpen(window.location.pathname)
}

const useListPaneStore = create<ListPaneStore>()((set) => ({
  open: initialListPaneOpen(),
  actions: {
    collapse: () => set({ open: false }),
    expand: () => set({ open: true }),
  },
}))

export function useListPaneCanCollapse() {
  return Boolean(useMatch({ from: '/changesets/$id', shouldThrow: false }))
}

export function useListPaneOpen() {
  const storedOpen = useListPaneStore((state) => state.open)
  const canCollapse = useListPaneCanCollapse()
  return canCollapse ? storedOpen : true
}

export const useListPaneActions = () => useListPaneStore((state) => state.actions)

export function getListPaneOpen() {
  const storedOpen = useListPaneStore.getState().open
  if (typeof window === 'undefined') return true
  return effectiveListPaneOpen(window.location.pathname, storedOpen)
}
