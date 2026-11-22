import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const persistedSchema = z.object({ dismissed: z.record(z.string(), z.number()) })

interface AreaLimitHintStore {
  /** Saved filter id → when its hint was answered in this browser. */
  dismissed: Record<string, number>
  actions: {
    dismiss: (aoiId: string) => void
  }
}

/** The "Maximum changeset size" hint on a saved filter shows once per filter and browser. */
const useAreaLimitHintStore = create<AreaLimitHintStore>()(
  persist(
    (set, get) => ({
      dismissed: {},
      actions: {
        dismiss: (aoiId) => set({ dismissed: { ...get().dismissed, [aoiId]: Date.now() } }),
      },
    }),
    {
      name: 'osmcha-area-limit-hint',
      partialize: (state) => ({ dismissed: state.dismissed }),
      merge: (persistedState, currentState) => {
        const parsed = persistedSchema.safeParse(persistedState)
        if (!parsed.success) return currentState
        return { ...currentState, dismissed: parsed.data.dismissed }
      },
    },
  ),
)

export const useIsAreaLimitHintDismissed = (aoiId: string | null) =>
  useAreaLimitHintStore((state) => aoiId != null && state.dismissed[aoiId] !== undefined)

export const useAreaLimitHintActions = () => useAreaLimitHintStore((state) => state.actions)
