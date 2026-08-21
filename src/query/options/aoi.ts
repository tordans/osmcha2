import { queryOptions } from '@tanstack/react-query'
import { fetchAllAOIs, fetchAOI } from '../../network/aoi.ts'
import { cacheSavedFilters } from '../cachePolicy.ts'

export function aoiQueryOptions(aoiId: string) {
  return queryOptions({
    queryKey: ['aoi', aoiId],
    queryFn: () => fetchAOI(aoiId),
    ...cacheSavedFilters,
    retry: 3,
  })
}

export function allAoisQueryOptions() {
  return queryOptions({
    queryKey: ['aois'],
    queryFn: fetchAllAOIs,
    ...cacheSavedFilters,
    retry: 3,
  })
}
