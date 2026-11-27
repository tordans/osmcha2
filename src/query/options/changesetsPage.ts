import { queryOptions } from '@tanstack/react-query'
import { fetchChangesetsPage } from '../../network/changesets_page.ts'
import { retryUnlessRefused } from '../../network/request.ts'
import { cacheForever } from '../cachePolicy.ts'

export interface ChangesetsPageParams {
  pageIndex: number
  filters: Record<string, unknown>
  aoiId: string | null
}

export function changesetsPageQueryOptions({ pageIndex, filters, aoiId }: ChangesetsPageParams) {
  return queryOptions({
    queryKey: ['changesets', 'page', pageIndex, filters, aoiId],
    queryFn: () => fetchChangesetsPage(pageIndex, filters, aoiId, false),
    // Review queue: never auto-refetch; the list refresh button does it.
    ...cacheForever,
    retry: retryUnlessRefused(3),
  })
}
