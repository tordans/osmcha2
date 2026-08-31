import { useQueryClient } from '@tanstack/react-query'
import { useFilters } from '../../hooks/useFilters.ts'
import { useAuthToken } from '../../stores/auth-store.ts'
import { aoiQueryOptions } from '../options/aoi.ts'
import { changesetsPageQueryOptions } from '../options/changesetsPage.ts'

export function usePrefetchChangesetsPage() {
  const queryClient = useQueryClient()
  const token = useAuthToken()
  const { filters, aoiId, page } = useFilters()

  return function prefetchChangesetsPage() {
    if (!token) return

    void queryClient.prefetchQuery(
      changesetsPageQueryOptions({
        pageIndex: page - 1,
        filters,
        aoiId,
      }),
    )

    if (aoiId) {
      void queryClient.prefetchQuery(aoiQueryOptions(aoiId))
    }
  }
}
