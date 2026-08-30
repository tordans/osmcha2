import { create } from 'zustand'

interface SpyglassStore {
  enabled: boolean
  /** Null until the changeset map reports a zoom (or we seed from the URL). */
  mapZoom: number | null
  actions: {
    toggleEnabled: () => void
    setMapZoom: (zoom: number | null) => void
  }
}

const useSpyglassStore = create<SpyglassStore>()((set) => ({
  enabled: false,
  mapZoom: null,
  actions: {
    toggleEnabled: () => set((state) => ({ enabled: !state.enabled })),
    setMapZoom: (zoom) => set((state) => (state.mapZoom === zoom ? state : { mapZoom: zoom })),
  },
}))

export const useSpyglassEnabled = () => useSpyglassStore((state) => state.enabled)

export const useSpyglassMapZoom = () => useSpyglassStore((state) => state.mapZoom)

export const useSpyglassActions = () => useSpyglassStore((state) => state.actions)
