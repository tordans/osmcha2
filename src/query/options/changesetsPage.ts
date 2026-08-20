import { queryOptions } from '@tanstack/react-query'
import { fetchChangesetsPage } from '../../network/changesets_page.ts'
import { cacheFiveMinutes } from '../cachePolicy.ts'

export interface ChangesetsPageParams {
  pageIndex: number
  filters: Record<string, unknown>
  aoiId: string | null
}

export function changesetsPageQueryOptions({ pageIndex, filters, aoiId }: ChangesetsPageParams) {
  return queryOptions({
    queryKey: ['changesets', 'page', pageIndex, filters, aoiId],
    queryFn: () => fetchChangesetsPage(pageIndex, filters, aoiId, false),
    ...cacheFiveMinutes,
    retry: 3,
  })
}
