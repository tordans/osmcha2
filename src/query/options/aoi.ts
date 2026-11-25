import { queryOptions } from '@tanstack/react-query'
import { aoiListFromQueryData, fetchAllAOIs, fetchAOI } from '../../network/aoi.ts'
import { retryUnlessRefused } from '../../network/request.ts'
import { cacheSavedFilters } from '../cachePolicy.ts'

export function aoiQueryOptions(aoiId: string) {
  return queryOptions({
    queryKey: ['aoi', aoiId],
    queryFn: () => fetchAOI(aoiId),
    ...cacheSavedFilters,
    retry: retryUnlessRefused(3),
  })
}

export function allAoisQueryOptions() {
  return queryOptions({
    queryKey: ['aois'],
    queryFn: fetchAllAOIs,
    // Persist may still hold a FeatureCollection from before we stored a plain array.
    select: (data) => aoiListFromQueryData(data),
    ...cacheSavedFilters,
    retry: retryUnlessRefused(3),
  })
}
