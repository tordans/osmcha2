import { queryOptions } from '@tanstack/react-query'
import { fetchAllAOIs, fetchAOI } from '../../network/aoi.ts'
import { cacheForever } from '../cachePolicy.ts'

export function aoiQueryOptions(aoiId: string) {
  return queryOptions({
    queryKey: ['aoi', aoiId],
    queryFn: () => fetchAOI(aoiId),
    ...cacheForever,
    retry: 3,
  })
}

export function allAoisQueryOptions() {
  return queryOptions({
    queryKey: ['aois'],
    queryFn: fetchAllAOIs,
    ...cacheForever,
    retry: 3,
  })
}
