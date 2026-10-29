import { create } from 'zustand'
import type { StreetImageryRef } from '../components/street_imagery/streetImageryTags.ts'

/** Where "Show on map" put the temporary marker. */
type PhotoMarker = StreetImageryRef & { lat: number; lng: number }

interface StreetImageryViewerStore {
  /** The photo of the viewer dialog. Kept after closing so the dialog can fade out with its content. */
  photo: StreetImageryRef | null
  open: boolean
  marker: PhotoMarker | null
  actions: {
    openPhoto: (photo: StreetImageryRef) => void
    close: () => void
    showMarker: (marker: PhotoMarker) => void
    clearMarker: () => void
  }
}

const useStreetImageryViewerStore = create<StreetImageryViewerStore>()((set) => ({
  photo: null,
  open: false,
  marker: null,
  actions: {
    openPhoto: (photo) => set({ photo, open: true }),
    close: () => set((state) => (state.open ? { open: false } : state)),
    showMarker: (marker) => set({ marker }),
    clearMarker: () => set((state) => (state.marker ? { marker: null } : state)),
  },
}))

export const useStreetImageryViewerPhoto = () => useStreetImageryViewerStore((state) => state.photo)

export const useStreetImageryViewerOpen = () => useStreetImageryViewerStore((state) => state.open)

export const useStreetImageryMarker = () => useStreetImageryViewerStore((state) => state.marker)

export const useStreetImageryViewerActions = () =>
  useStreetImageryViewerStore((state) => state.actions)

export const getStreetImageryViewerActions = () => useStreetImageryViewerStore.getState().actions
