import type { NormalizedPhoto } from '@osm-editor-kit/street-imagery'
import { create } from 'zustand'
import type { StreetImageryRef } from '../components/street_imagery/streetImageryTags.ts'

/** A photo that looks at a place, and the bearing from the photo to that place. */
export type PlacePhoto = StreetImageryRef & { bearing: number }

interface StreetImageryViewerStore {
  /** The photo of the viewer dialog. Kept after closing so the dialog can fade out with its content. */
  photo: StreetImageryRef | null
  open: boolean
  /** The photo the viewer shows now, for the map: stepping along a sequence moves on from `photo`. */
  shownPhoto: NormalizedPhoto | null
  /** The photos that look at the place the viewer was opened for; null for a single photo. */
  placePhotos: readonly PlacePhoto[] | null
  actions: {
    openPhoto: (photo: StreetImageryRef) => void
    /** Opens the first of the photos of a place; the viewer then steps through them. */
    openPlacePhotos: (photos: readonly [PlacePhoto, ...PlacePhoto[]]) => void
    /** Another photo in the open viewer, which stays on its place. */
    showPhoto: (photo: StreetImageryRef) => void
    close: () => void
    setShownPhoto: (shownPhoto: NormalizedPhoto) => void
  }
}

const useStreetImageryViewerStore = create<StreetImageryViewerStore>()((set) => ({
  photo: null,
  open: false,
  shownPhoto: null,
  placePhotos: null,
  actions: {
    openPhoto: (photo) => set({ photo, open: true, placePhotos: null }),
    openPlacePhotos: (photos) => set({ photo: photos[0], open: true, placePhotos: photos }),
    showPhoto: (photo) => set({ photo }),
    close: () =>
      set((state) => (state.open ? { open: false, placePhotos: null, shownPhoto: null } : state)),
    setShownPhoto: (shownPhoto) => set({ shownPhoto }),
  },
}))

export const useStreetImageryViewerPhoto = () => useStreetImageryViewerStore((state) => state.photo)

export const useStreetImageryPlacePhotos = () =>
  useStreetImageryViewerStore((state) => state.placePhotos)

export const useStreetImageryViewerOpen = () => useStreetImageryViewerStore((state) => state.open)

export const useStreetImageryShownPhoto = () =>
  useStreetImageryViewerStore((state) => state.shownPhoto)

export const useStreetImageryViewerActions = () =>
  useStreetImageryViewerStore((state) => state.actions)

export const getStreetImageryViewerActions = () => useStreetImageryViewerStore.getState().actions

export const getStreetImageryViewerState = () => {
  const { photo, placePhotos } = useStreetImageryViewerStore.getState()
  return { photo, placePhotos }
}
