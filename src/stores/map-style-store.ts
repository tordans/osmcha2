import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_BASEMAP_ID, isBuiltinBasemapId } from '../map/basemapIds.ts'
import { safeJSONStorage, waitForHydration } from './persistStorage.ts'

const persistedMapSchema = z.object({
  style: z.string(),
})

/** The changeset's imagery the map switched to by itself, and the background the reader had. */
type AutoApplied = { styleId: string; previous: string }

interface MapStyleStore {
  style: string
  /** For this tab only: the next changeset starts again from the reader's background. */
  autoApplied: AutoApplied | null
  actions: {
    setStyle: (style: string) => void
    /** Shows a changeset's imagery without making it the reader's saved background. */
    applyChangesetStyle: (style: string) => void
    /**
     * Back to the reader's background, if the map still shows the changeset's imagery. `keep`: the
     * next changeset's imagery; when it is the one shown, the map stays on it.
     */
    revertChangesetStyle: (keep?: string) => void
  }
}

function persistedStyle(state: Pick<MapStyleStore, 'style' | 'autoApplied'>) {
  const style =
    state.autoApplied?.styleId === state.style ? state.autoApplied.previous : state.style
  return isBuiltinBasemapId(style) ? style : DEFAULT_BASEMAP_ID
}

const useMapStyleStore = create<MapStyleStore>()(
  persist(
    (set, get) => ({
      style: DEFAULT_BASEMAP_ID,
      autoApplied: null,
      actions: {
        // persist writes localStorage after every set call, so skip unchanged styles.
        // A pick of the reader, also of the imagery shown already, is theirs to keep.
        setStyle: (style) => {
          if (get().style !== style || get().autoApplied) set({ style, autoApplied: null })
        },
        applyChangesetStyle: (style) => {
          const { style: previous, autoApplied } = get()
          if (previous === style) return
          // Switching from one changeset's imagery to the next keeps the reader's background.
          const base = autoApplied?.styleId === previous ? autoApplied.previous : previous
          set({ style, autoApplied: { styleId: style, previous: base } })
        },
        revertChangesetStyle: (keep) => {
          const { style, autoApplied } = get()
          if (!autoApplied) return
          if (keep != null && autoApplied.styleId === keep && style === keep) return
          set({
            style: autoApplied.styleId === style ? autoApplied.previous : style,
            autoApplied: null,
          })
        },
      },
    }),
    {
      name: 'map-controls',
      storage: safeJSONStorage(),
      partialize: (state) => ({ style: persistedStyle(state) }),
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
