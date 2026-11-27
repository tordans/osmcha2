import { getRouteApi, useRouter } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth.ts'
import { filtersFromSearch, withFilters } from '../../routing/filterSearch.ts'
import { isRecentList, myChangesetsFilters } from '../list/useSelectedList.ts'
import { isOwnChangeset } from './ownChangeset.ts'

const rootRouteApi = getRouteApi('__root__')

/**
 * One of the user's own changesets, opened by a link without a list ("Recent"): the list becomes
 * "My Changesets", as they most likely look at their own edits. Only where the tab started (the
 * first history entry): an own changeset clicked in the Recent list keeps that list. Decided once
 * per changeset, so switching to another list afterwards sticks.
 */
export function useOwnChangesetList(
  changesetId: number | null,
  author: { username?: string; uid?: number | string } | undefined,
) {
  const { user } = useAuth()
  const search = rootRouteApi.useSearch()
  const navigate = rootRouteApi.useNavigate()
  const router = useRouter()
  const decidedRef = useRef<number | null>(null)
  const uid = user?.uid
  const recent = isRecentList(filtersFromSearch(search), search.aoi)
  const own = author != null && isOwnChangeset(user, author)
  const known = changesetId != null && author != null && uid != null

  useEffect(
    function openOwnChangesetInMyChangesets() {
      // Wait for the author and the signed-in user before deciding.
      if (!known || uid == null || decidedRef.current === changesetId) return
      decidedRef.current = changesetId
      const openedByLink = router.state.location.state.__TSR_index === 0
      if (!own || !recent || !openedByLink) return
      void navigate({
        to: '.',
        search: (prev) => withFilters({ ...prev, page: undefined }, myChangesetsFilters(uid)),
        replace: true,
      })
    },
    [changesetId, known, uid, own, recent, navigate, router],
  )
}
