import { create } from 'zustand'

/** The background a changeset used that the map tried and could not load, so it kept the default. */
export type BasemapFallback = {
  changesetId: number
  styleId: string
  label: string
}

interface BasemapFallbackStore {
  fallback: BasemapFallback | null
  actions: {
    setFallback: (fallback: BasemapFallback | null) => void
  }
}

const useBasemapFallbackStore = create<BasemapFallbackStore>()((set) => ({
  fallback: null,
  actions: {
    setFallback: (fallback) => set({ fallback }),
  },
}))

export const useBasemapFallback = () => useBasemapFallbackStore((state) => state.fallback)

export function getBasemapFallbackActions() {
  return useBasemapFallbackStore.getState().actions
}
