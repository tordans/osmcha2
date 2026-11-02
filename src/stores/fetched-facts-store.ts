import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type FetchedEntry<Facts> = {
  fetchedAt: number
  facts: Facts
  /** Folded away by hand: the entry stays, and long ones stay out of the way. */
  open: boolean
}

/** 30 days, as MAID keeps wiki pages. The reload button is there for what changed sooner. */
export const FETCHED_FACTS_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

/** A third party that does not answer must not leave a button spinning. */
const LOAD_TIMEOUT_MS = 15_000

type LoadStatus = 'loading' | 'failed'

type FetchedFactsState<Facts> = {
  entries: Record<string, FetchedEntry<Facts>>
  actions: {
    load: (id: string) => Promise<void>
    setOpen: (id: string, open: boolean) => void
  }
}

/** The entries of a stored value that fit and are younger than `maxAgeMs`. Never throws. */
export function parseFetchedEntries<Facts>(
  value: unknown,
  { factsSchema, maxAgeMs, now }: { factsSchema: z.ZodType<Facts>; maxAgeMs: number; now: number },
) {
  const entrySchema = z.object({
    fetchedAt: z.number(),
    facts: factsSchema,
    open: z.boolean().catch(true),
  })
  const stored = z.object({ entries: z.record(z.string(), z.unknown()) }).safeParse(value)
  const entries: Record<string, FetchedEntry<Facts>> = {}
  if (!stored.success) return { entries }
  for (const [id, item] of Object.entries(stored.data.entries)) {
    const entry = entrySchema.safeParse(item)
    if (entry.success && now - entry.data.fetchedAt < maxAgeMs) {
      entries[id] = entry.data as FetchedEntry<Facts>
    }
  }
  return { entries }
}

/**
 * What a person asked a third party about a tag, kept in localStorage: nothing is requested without
 * a click, and what came back shows directly until `maxAgeMs` has passed, open or folded as it was
 * left.
 */
export function createFetchedFactsStore<Facts>({
  name,
  maxAgeMs,
  factsSchema,
  fetchFacts,
}: {
  name: string
  maxAgeMs: number
  factsSchema: z.ZodType<Facts>
  fetchFacts: (id: string, signal: AbortSignal) => Promise<Facts>
}) {
  // Apart from the entries: an id that is loading, or whose last load failed, is only for this
  // visit, and must not write all entries to storage.
  const useStatusStore = create<Record<string, LoadStatus>>()(() => ({}))

  function setStatus(id: string, status: LoadStatus | null) {
    useStatusStore.setState((state) => {
      const { [id]: _previous, ...others } = state
      return status ? { ...others, [id]: status } : others
    }, true)
  }

  const useStore = create<FetchedFactsState<Facts>>()(
    persist(
      (set) => ({
        entries: {},
        actions: {
          load: async (id) => {
            if (useStatusStore.getState()[id] === 'loading') return
            setStatus(id, 'loading')
            try {
              const facts = await fetchFacts(id, AbortSignal.timeout(LOAD_TIMEOUT_MS))
              set((state) => {
                const open = state.entries[id]?.open ?? true
                const entry = { fetchedAt: Date.now(), facts, open }
                return { entries: { ...state.entries, [id]: entry } }
              })
              setStatus(id, null)
            } catch {
              setStatus(id, 'failed')
            }
          },
          setOpen: (id, open) =>
            set((state) => {
              const entry = state.entries[id]
              return entry ? { entries: { ...state.entries, [id]: { ...entry, open } } } : state
            }),
        },
      }),
      {
        name,
        partialize: ({ entries }) => ({ entries }),
        merge: (persistedState, currentState) => ({
          ...currentState,
          ...parseFetchedEntries(persistedState, { factsSchema, maxAgeMs, now: Date.now() }),
        }),
      },
    ),
  )

  return {
    useEntry: (id: string) => useStore((state) => state.entries[id] ?? null),
    useStatus: (id: string) => useStatusStore((state) => state[id] ?? null),
    useActions: () => useStore((state) => state.actions),
  }
}
