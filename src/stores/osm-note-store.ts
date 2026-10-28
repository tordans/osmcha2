import { create } from 'zustand'

/** Where "Show on map" put the temporary marker. */
type OsmNoteMarker = { id: number; lat: number; lng: number }

interface OsmNoteStore {
  /** The note of the quick view. Kept after closing so the dialog can fade out with its content. */
  noteId: number | null
  open: boolean
  marker: OsmNoteMarker | null
  actions: {
    openNote: (noteId: number) => void
    close: () => void
    showMarker: (marker: OsmNoteMarker) => void
    clearMarker: () => void
  }
}

const useOsmNoteStore = create<OsmNoteStore>()((set) => ({
  noteId: null,
  open: false,
  marker: null,
  actions: {
    openNote: (noteId) => set({ noteId, open: true }),
    close: () => set((state) => (state.open ? { open: false } : state)),
    showMarker: (marker) => set({ marker }),
    clearMarker: () => set((state) => (state.marker ? { marker: null } : state)),
  },
}))

export const useOsmNoteId = () => useOsmNoteStore((state) => state.noteId)

export const useOsmNoteOpen = () => useOsmNoteStore((state) => state.open)

export const useOsmNoteMarker = () => useOsmNoteStore((state) => state.marker)

export const useOsmNoteActions = () => useOsmNoteStore((state) => state.actions)

export const getOsmNoteActions = () => useOsmNoteStore.getState().actions
