import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_BASEMAP_ID, isBuiltinBasemapId } from '../map/basemapIds.ts'
import { safeJSONStorage, waitForHydration } from './persistStorage.ts'

const persistedMapSchema = z.object({
  style: z.string(),
})

interface MapStyleStore {
  style: string
  actions: {
    setStyle: (style: string) => void
  }
}

const useMapStyleStore = create<MapStyleStore>()(
  persist(
    (set, get) => ({
      style: DEFAULT_BASEMAP_ID,
      actions: {
        // persist writes localStorage after every set call, so skip unchanged styles.
        setStyle: (style) => {
          if (get().style !== style) set({ style })
        },
      },
    }),
    {
      name: 'map-controls',
      storage: safeJSONStorage(),
      partialize: (state) => ({
        style: isBuiltinBasemapId(state.style) ? state.style : DEFAULT_BASEMAP_ID,
      }),
      merge: (persistedState, currentState) => {
        const parsed = persistedMapSchema.safeParse(persistedState)
        if (!parsed.success) return currentState
        const style = isBuiltinBasemapId(parsed.data.style) ? parsed.data.style : DEFAULT_BASEMAP_ID
        return { ...currentState, style }
      },
    },
  ),
)

export const useMapStyle = () => useMapStyleStore((state) => state.style)

export const useMapStyleActions = () => useMapStyleStore((state) => state.actions)

export function getMapStyle() {
  return useMapStyleStore.getState().style
}

export function getMapStyleActions() {
  return useMapStyleStore.getState().actions
}

export function waitForMapStyleHydration(): Promise<void> {
  return waitForHydration(useMapStyleStore)
}
