import { useMatch } from '@tanstack/react-router'
import { create } from 'zustand'

interface ListPaneStore {
  open: boolean
  actions: {
    collapse: () => void
    expand: () => void
  }
}

/** GitHub Pages serves the app under `/osmcha2`; `window.location` keeps that prefix. */
function stripBasePath(pathname: string, base: string) {
  const prefix = base.replace(/\/+$/, '')
  if (prefix === '' || !pathname.startsWith(prefix)) return pathname
  const rest = pathname.slice(prefix.length)
  return rest === '' || rest.startsWith('/') ? rest || '/' : pathname
}

function isChangesetPath(pathname: string, base: string = import.meta.env.BASE_URL ?? '/') {
  return stripBasePath(pathname, base).startsWith('/changesets/')
}

/**
 * Closed on changeset URLs so a deep link focuses the map, even when the URL also
 * carries a list (`aoi`, filters). List mode starts once the reviewer opens the list.
 */
export function defaultListPaneOpen(pathname: string, base?: string) {
  return !isChangesetPath(pathname, base)
}

/** Collapse is only allowed while a changeset is selected. */
export function effectiveListPaneOpen(pathname: string, storedOpen: boolean, base?: string) {
  return isChangesetPath(pathname, base) ? storedOpen : true
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
