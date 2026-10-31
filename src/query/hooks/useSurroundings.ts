import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { clear, createStore, del, entries, set } from 'idb-keyval'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { fetchSurroundings, MAX_SURROUNDINGS_OBJECTS } from '../../network/postpass.ts'
import { useSurroundingsActions } from '../../stores/surroundings-store.ts'
import { boxKey } from '../../views/surroundingsBoxes.ts'
import type { LngLatBox } from '../../views/tagGroupFeatures.ts'

export const SURROUNDINGS_MAX_AGE_MS = 60 * 60 * 1000
/** Oldest boxes go first; 60 dense boxes are about 60 MB. */
const MAX_KEPT_BOXES = 60

export type LoadedBox = LngLatBox & {
  features: GeoJSON.Feature[]
  /** State of the OSM data, from Postpass. */
  timestamp: string
  loadedAt: number
}

type LoadedBoxes = Readonly<Record<string, LoadedBox>>

const NO_BOXES: LoadedBoxes = {}
const queryKey = ['surroundings'] as const
const boxStore = createStore('osmcha-surroundings-boxes', 'boxes')

/** The boxes of the last hour. Reads the browser's store only: no request goes out. */
async function restoreBoxes() {
  const boxes: Record<string, LoadedBox> = {}
  for (const [key, box] of await entries<string, LoadedBox>(boxStore)) {
    if (Date.now() - box.loadedAt < SURROUNDINGS_MAX_AGE_MS) boxes[key] = box
    else void del(key, boxStore)
  }
  return boxes
}

/**
 * All loaded boxes, in one entry like the coverage of route-tracer. The query only restores them;
 * new boxes come from the click in `useLoadSurroundings`. Not tied to a changeset: the next one in
 * the same place finds its boxes here.
 */
export function useSurroundingsBoxes() {
  const { data } = useQuery({
    queryKey,
    queryFn: () => restoreBoxes().catch(() => NO_BOXES),
    networkMode: 'always',
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })
  return data ?? NO_BOXES
}

/** For the debug panel: forgets all loaded boxes, so that the next click asks Postpass again. */
export function useClearSurroundings() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.setQueryData<LoadedBoxes>(queryKey, NO_BOXES)
    void clear(boxStore)
  }
}

/** Loads boxes one after the other, stops at the first failure and never retries. */
export function useLoadSurroundings() {
  const queryClient = useQueryClient()
  const { setVisible } = useSurroundingsActions()
  const abortRef = useRef<AbortController | null>(null)

  useEffect(function abortOnLeave() {
    return function abortLoading() {
      abortRef.current?.abort()
    }
  }, [])

  function keepBox(box: LoadedBox) {
    const key = boxKey(box)
    queryClient.setQueryData<LoadedBoxes>(queryKey, (boxes = NO_BOXES) => {
      const kept = Object.entries({ ...boxes, [key]: box }).toSorted(
        ([, left], [, right]) => right.loadedAt - left.loadedAt,
      )
      for (const [droppedKey] of kept.slice(MAX_KEPT_BOXES)) void del(droppedKey, boxStore)
      return Object.fromEntries(kept.slice(0, MAX_KEPT_BOXES))
    })
    // Without the store the box is only gone after a reload.
    set(key, box, boxStore).catch(() => undefined)
  }

  const mutation = useMutation({
    mutationFn: async (boxes: readonly LngLatBox[]) => {
      const controller = new AbortController()
      abortRef.current = controller
      let truncated = false
      for (const box of boxes) {
        const result = await fetchSurroundings(box, controller.signal)
        truncated ||= result.truncated
        keepBox({
          ...box,
          features: result.features,
          timestamp: result.timestamp,
          loadedAt: Date.now(),
        })
      }
      return { truncated }
    },
    onSuccess: ({ truncated }) => {
      if (truncated) {
        toast(`Some areas are cut off at ${MAX_SURROUNDINGS_OBJECTS} objects.`)
      }
    },
    onError: (error) => {
      if (abortRef.current?.signal.aborted) return
      toast.error('Could not load the surroundings', { description: error.message })
    },
  })

  return {
    loading: mutation.isPending,
    load: (boxes: readonly LngLatBox[]) => {
      setVisible(true)
      mutation.mutate(boxes)
    },
  }
}
