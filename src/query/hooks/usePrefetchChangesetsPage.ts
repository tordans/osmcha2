import { useQueryClient } from '@tanstack/react-query'
import { useFilters } from '../../hooks/useFilters.ts'
import { useAuthStore } from '../../stores/authStore.ts'
import { aoiQueryOptions } from '../options/aoi.ts'
import { changesetsPageQueryOptions } from '../options/changesetsPage.ts'

export function usePrefetchChangesetsPage() {
  const queryClient = useQueryClient()
  const token = useAuthStore((state) => state.token)
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
