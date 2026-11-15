import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import {
  adiffOverlap,
  changesetBboxOverlap,
  reviewAreaFromFilters,
  type ReviewArea,
  type ReviewAreaOverlap,
} from '../components/changeset/reviewArea.ts'
import { fetchAndParseAugmentedDiff } from '../network/changeset.ts'
import { useAOI } from '../query/hooks/useAOI.ts'
import {
  changesetMapFromOverpassQueryOptions,
  changesetMapQueryOptions,
} from '../query/options/changeset.ts'
import { changesetsPageQueryOptions } from '../query/options/changesetsPage.ts'
import { useAuthToken } from '../stores/auth-store.ts'
import {
  getReviewAreaOverlapActions,
  getStoredReviewAreaOverlap,
  storedOverlapOf,
  useReviewAreaOverlapActions,
  useStoredReviewAreaOverlap,
  useStoredReviewAreaOverlaps,
} from '../stores/review-area-overlap-store.ts'
import { useFilters } from './useFilters.ts'

/** The location filter of the list in view: from the URL, or from the saved filter. */
export function useReviewArea(): ReviewArea | null {
  const { filters, aoiId } = useFilters()
  const { data: aoi } = useAOI(aoiId)
  const source = aoiId ? aoi?.properties?.filters : filters
  // URL filters are rebuilt on every render; compare by content.
  const sourceKey = JSON.stringify({
    geometry: source?.geometry ?? null,
    in_bbox: source?.in_bbox ?? null,
  })
  return useMemo(() => reviewAreaFromFilters(JSON.parse(sourceKey)), [sourceKey])
}

/** `unknown` until the edits are loaded; null when the list has no location filter. */
export type ReviewAreaStatus = ReviewAreaOverlap | 'unknown'

/**
 * Whether a changeset's edits meet the review area. Answers from what is at hand: a stored
 * result, the changeset bbox lying wholly inside, or a map diff already in the Query cache.
 * Never fetches on its own.
 */
export function useReviewAreaOverlap(
  changesetId: number,
  changesetGeometry: unknown,
): ReviewAreaStatus | null {
  const area = useReviewArea()
  const stored = useStoredReviewAreaOverlap(area?.key ?? null, changesetId)
  const { setOverlap } = useReviewAreaOverlapActions()
  const fromBbox = useMemo(
    () => (area ? changesetBboxOverlap(changesetGeometry, area) : null),
    [area, changesetGeometry],
  )
  // Cache readers only: the review route loads the diff, the list may prefetch it.
  const { data: adiffMap } = useQuery({
    ...changesetMapQueryOptions(changesetId),
    enabled: false,
  })
  const { data: overpassMap } = useQuery({
    ...changesetMapFromOverpassQueryOptions(changesetId),
    enabled: false,
  })
  const adiff = (adiffMap ?? overpassMap)?.adiff
  const fromEdits = useMemo(
    () =>
      area && adiff && stored == null && fromBbox == null
        ? adiffOverlap(adiff.actions, area)
        : null,
    [area, adiff, stored, fromBbox],
  )

  useEffect(
    function storeOverlapFromEdits() {
      if (area && fromEdits) setOverlap(area.key, changesetId, fromEdits)
    },
    [area, fromEdits, changesetId, setOverlap],
  )

  if (!area) return null
  return stored ?? fromBbox ?? fromEdits ?? 'unknown'
}

/**
 * The next changeset in the list after `changesetId` that is not known to lie outside the review
 * area, or null when the page has none left. Reads the list page the list pane uses.
 */
export function useNextChangesetInReviewArea(changesetId: number): number | null {
  const { filters, aoiId, page } = useFilters()
  const area = useReviewArea()
  const stored = useStoredReviewAreaOverlaps()
  const token = useAuthToken()
  // Shares the list's cache; loads the page once when the review opened without the list.
  const { data: listPage } = useQuery({
    ...changesetsPageQueryOptions({ pageIndex: page - 1, filters, aoiId }),
    enabled: Boolean(area && token),
  })
  const features = listPage?.features ?? []
  const index = features.findIndex((feature) => feature.id === changesetId)
  if (index < 0) return null
  for (const feature of features.slice(index + 1)) {
    if (typeof feature.id !== 'number') continue
    if (!area) return feature.id
    const known =
      storedOverlapOf(stored, area.key, feature.id) ?? changesetBboxOverlap(feature.geometry, area)
    if (known !== 'outside') return feature.id
  }
  return null
}

/** Bigger changesets are checked when opened: their diff is large and they rarely mislead. */
const REVIEW_AREA_PREFETCH_MAX_CHANGES = 1000
const REVIEW_AREA_PREFETCH_CONCURRENCY = 2

type ListedChangeset = {
  id: number
  geometry?: unknown
  properties?: { create?: number | null; modify?: number | null; delete?: number | null } | null
}

/**
 * Checks the listed changesets that the bbox alone cannot place, so the list can flag the ones
 * outside the review area before anyone opens them. Loads their diffs a few at a time and keeps
 * only the result; huge changesets wait until they are opened.
 */
export function useReviewAreaPrefetch(features: readonly ListedChangeset[] | undefined) {
  const area = useReviewArea()
  const ids = (features ?? [])
    .filter((feature) => {
      if (!area) return false
      const { create, modify, delete: deleted } = feature.properties ?? {}
      const changes = (create ?? 0) + (modify ?? 0) + (deleted ?? 0)
      if (changes > REVIEW_AREA_PREFETCH_MAX_CHANGES) return false
      return changesetBboxOverlap(feature.geometry, area) == null
    })
    .map((feature) => feature.id)
  // The list page is a new array on every render; restart only when the ids change.
  const idsKey = ids.join(',')

  useEffect(
    function checkListedChangesets() {
      if (!area || idsKey === '') return
      let cancelled = false
      const queue = idsKey
        .split(',')
        .map(Number)
        .filter((id) => getStoredReviewAreaOverlap(area.key, id) == null)
      async function work() {
        while (!cancelled) {
          const id = queue.shift()
          if (id == null) return
          if (getStoredReviewAreaOverlap(area!.key, id) != null) continue
          try {
            const adiff = await fetchAndParseAugmentedDiff(id)
            if (cancelled) return
            const overlap = adiffOverlap(adiff.actions, area!)
            if (overlap) getReviewAreaOverlapActions().setOverlap(area!.key, id, overlap)
          } catch {
            // No diff yet, or offline: the changeset is checked when it is opened.
          }
        }
      }
      for (let i = 0; i < REVIEW_AREA_PREFETCH_CONCURRENCY; i++) void work()
      return function cancel() {
        cancelled = true
      }
    },
    [area, idsKey],
  )
}
