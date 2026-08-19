import { create } from 'zustand'

interface MapLoadedStore {
  mapLoaded: boolean
  actions: {
    markMapLoaded: () => void
    resetMapLoaded: () => void
  }
}

const useMapLoadedStore = create<MapLoadedStore>()((set) => ({
  mapLoaded: false,
  actions: {
    markMapLoaded: () => set((state) => (state.mapLoaded ? state : { mapLoaded: true })),
    resetMapLoaded: () => set((state) => (state.mapLoaded ? { mapLoaded: false } : state)),
  },
}))

export const useMapLoaded = () => useMapLoadedStore((state) => state.mapLoaded)

export const useMapActions = () => useMapLoadedStore((state) => state.actions)
