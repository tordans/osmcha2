import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ReviewAreaOverlap } from '../components/changeset/reviewArea.ts'

/** A changeset's edits never change, so a result holds as long as we keep it. */
const REVIEW_AREA_OVERLAP_MAX_ENTRIES = 3000

type Entry = { overlap: ReviewAreaOverlap; at: number }
type Entries = Record<string, Entry>

const persistedSchema = z.object({
  entries: z.record(
    z.string(),
    z.object({ overlap: z.enum(['inside', 'outside']), at: z.number() }),
  ),
})

function entryKey(areaKey: string, changesetId: number) {
  return `${areaKey}:${changesetId}`
}

/** Keeps the newest entries up to the cap. */
function pruneOverlapEntries(entries: Entries): Entries {
  const list = Object.entries(entries)
  if (list.length <= REVIEW_AREA_OVERLAP_MAX_ENTRIES) return entries
  return Object.fromEntries(
    list.sort(([, a], [, b]) => b.at - a.at).slice(0, REVIEW_AREA_OVERLAP_MAX_ENTRIES),
  )
}

interface ReviewAreaOverlapStore {
  entries: Entries
  actions: {
    setOverlap: (areaKey: string, changesetId: number, overlap: ReviewAreaOverlap) => void
  }
}

const useReviewAreaOverlapStore = create<ReviewAreaOverlapStore>()(
  persist(
    (set, get) => ({
      entries: {},
      actions: {
        setOverlap: (areaKey, changesetId, overlap) => {
          const key = entryKey(areaKey, changesetId)
          if (get().entries[key]?.overlap === overlap) return
          set({
            entries: pruneOverlapEntries({
              ...get().entries,
              [key]: { overlap, at: Date.now() },
            }),
          })
        },
      },
    }),
    {
      name: 'osmcha-review-area-overlap',
      partialize: (state) => ({ entries: state.entries }),
      merge: (persistedState, currentState) => {
        const parsed = persistedSchema.safeParse(persistedState)
        if (!parsed.success) return currentState
        return { ...currentState, entries: pruneOverlapEntries(parsed.data.entries) }
      },
    },
  ),
)

/** What the edits of a changeset showed for this area, or undefined while unknown. */
export const useStoredReviewAreaOverlap = (areaKey: string | null, changesetId: number) =>
  useReviewAreaOverlapStore((state) =>
    areaKey == null ? undefined : state.entries[entryKey(areaKey, changesetId)]?.overlap,
  )

/** Every stored result; pair with `storedOverlapOf` to look one up while rendering a list. */
export const useStoredReviewAreaOverlaps = () => useReviewAreaOverlapStore((state) => state.entries)

export function storedOverlapOf(entries: Entries, areaKey: string, changesetId: number) {
  return entries[entryKey(areaKey, changesetId)]?.overlap
}

export const useReviewAreaOverlapActions = () => useReviewAreaOverlapStore((state) => state.actions)

export function getStoredReviewAreaOverlap(areaKey: string, changesetId: number) {
  return useReviewAreaOverlapStore.getState().entries[entryKey(areaKey, changesetId)]?.overlap
}

export function getReviewAreaOverlapActions() {
  return useReviewAreaOverlapStore.getState().actions
}
