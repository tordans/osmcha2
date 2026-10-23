import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DAY_MS = 24 * 60 * 60 * 1000
export const READ_CHANGESET_MAX_AGE_MS = 30 * DAY_MS
export const READ_CHANGESET_MAX_ENTRIES = 2000

const persistedReadChangesetsSchema = z.object({
  readAt: z.record(z.string(), z.number()),
})

type ReadAt = Record<string, number>

/** Drops entries older than 30 days, then keeps only the newest entries up to the cap. */
export function pruneReadAt(readAt: ReadAt, now: number): ReadAt {
  const cutoff = now - READ_CHANGESET_MAX_AGE_MS
  const fresh = Object.entries(readAt)
    .filter(([, openedAt]) => openedAt >= cutoff)
    .sort(([, a], [, b]) => b - a)
    .slice(0, READ_CHANGESET_MAX_ENTRIES)
  return Object.fromEntries(fresh)
}

interface ReadChangesetsStore {
  readAt: ReadAt
  actions: {
    markRead: (id: number) => void
  }
}

const useReadChangesetsStore = create<ReadChangesetsStore>()(
  persist(
    (set, get) => ({
      readAt: {},
      actions: {
        markRead: (id) => {
          const now = Date.now()
          set({ readAt: pruneReadAt({ ...get().readAt, [String(id)]: now }, now) })
        },
      },
    }),
    {
      name: 'osmcha-read-changesets',
      partialize: (state) => ({ readAt: state.readAt }),
      merge: (persistedState, currentState) => {
        const parsed = persistedReadChangesetsSchema.safeParse(persistedState)
        if (!parsed.success) return currentState
        return { ...currentState, readAt: pruneReadAt(parsed.data.readAt, Date.now()) }
      },
    },
  ),
)

export const useIsChangesetRead = (id: number) =>
  useReadChangesetsStore((state) => state.readAt[String(id)] !== undefined)

export const useReadChangesetsActions = () => useReadChangesetsStore((state) => state.actions)

export function getIsChangesetRead(id: number) {
  return useReadChangesetsStore.getState().readAt[String(id)] !== undefined
}

export function getReadChangesetsActions() {
  return useReadChangesetsStore.getState().actions
}
