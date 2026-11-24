import { create } from 'zustand'

/**
 * The saved filter the URL filter in the form was copied from: set by "Duplicate" and
 * by old links that carried both `aoi` and filters. The form shows "Copy of …" until
 * the copy is applied, saved or left.
 */
interface FilterCopyStore {
  /** Saved filter id the copy came from. */
  sourceId: string | null
  /** Its name, when known. */
  sourceName: string | null
  /** The URL filters of the copy (`serializeFiltersToSearch` as JSON). Another list is not the copy. */
  filtersKey: string | null
  actions: {
    set: (sourceId: string, filtersKey: string, sourceName?: string | null) => void
    clear: () => void
  }
}

const useFilterCopyStore = create<FilterCopyStore>()((set) => ({
  sourceId: null,
  sourceName: null,
  filtersKey: null,
  actions: {
    set: (sourceId, filtersKey, sourceName = null) => set({ sourceId, sourceName, filtersKey }),
    clear: () => set({ sourceId: null, sourceName: null, filtersKey: null }),
  },
}))

export const useFilterCopySourceId = () => useFilterCopyStore((state) => state.sourceId)
export const useFilterCopyFiltersKey = () => useFilterCopyStore((state) => state.filtersKey)
export const useFilterCopySourceName = () => useFilterCopyStore((state) => state.sourceName)
export const getFilterCopyActions = () => useFilterCopyStore.getState().actions
