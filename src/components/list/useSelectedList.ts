import { useAuth } from '../../hooks/useAuth.ts'
import { useFilters } from '../../hooks/useFilters.ts'
import type { AoiFeature } from '../../network/aoi.ts'
import { useAOI, useAllAOIs } from '../../query/hooks/useAOI.ts'
import type { Filters } from '../filters/filterTypes.ts'

export function filterName(aoi: AoiFeature) {
  return aoi.properties?.name || `Filter ${aoi.id}`
}

function filterValue(filters: Record<string, unknown>, key: string) {
  const items = filters[key]
  if (!Array.isArray(items) || items[0] == null || typeof items[0] !== 'object') return undefined
  if (!('value' in items[0])) return undefined
  return items[0].value
}

/** The "My Changesets" list: the user's changesets of any date. */
export function myChangesetsFilters(uid: number | string): Filters {
  return {
    uids: [{ label: String(uid), value: String(uid) }],
    date__gte: [{ label: '', value: '' }],
  }
}

/** No saved filter and no filter but the sort order: the "Recent" list. */
export function isRecentList(filters: Record<string, unknown>, aoiId: string | null | undefined) {
  return !aoiId && Object.keys(filters).every((key) => key === 'order_by')
}

function selectedListLabel({
  savedName,
  isMyChangesets,
  isMyReviews,
  isRecent,
}: {
  savedName: string | undefined
  isMyChangesets: boolean
  isMyReviews: boolean
  isRecent: boolean
}) {
  if (savedName) return savedName
  if (isMyChangesets) return 'My Changesets'
  if (isMyReviews) return 'My Reviews'
  if (isRecent) return 'Recent'
  return 'Custom filter'
}

/** The list the URL points at: a saved filter, a preset, or a custom filter. */
export function useSelectedList() {
  const { user } = useAuth()
  const username = user?.username
  const uid = user?.uid
  const { filters, aoiId } = useFilters()
  const { data: aoi } = useAOI(aoiId)
  const { data } = useAllAOIs()
  const aois = data ?? []
  const selected = aois.find((item) => String(item.id) === aoiId)
  const selectedName = selected
    ? filterName(selected)
    : ((aoi?.properties?.name as string | undefined) ?? aoiId)

  const isSaved = Boolean(aoiId)
  const isMyChangesets =
    !isSaved && uid != null && String(filterValue(filters, 'uids')) === String(uid)
  const isMyReviews =
    !isSaved && Boolean(username) && filterValue(filters, 'checked_by') === username
  const isRecent = isRecentList(filters, aoiId)
  const label = selectedListLabel({
    savedName: isSaved ? (selectedName ?? undefined) : undefined,
    isMyChangesets,
    isMyReviews,
    isRecent,
  })

  return { aoiId, aois, selected, selectedName, isMyChangesets, isMyReviews, isRecent, label }
}
