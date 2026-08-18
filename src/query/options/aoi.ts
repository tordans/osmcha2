import { queryOptions } from '@tanstack/react-query'
import { fetchAllAOIs, fetchAOI } from '../../network/aoi.ts'

export function aoiQueryOptions(aoiId: string) {
  return queryOptions({
    queryKey: ['aoi', aoiId],
    queryFn: () => fetchAOI(aoiId),
    staleTime: 5 * 60 * 1000,
    retry: 3,
  })
}

export function allAoisQueryOptions() {
  return queryOptions({
    queryKey: ['aois'],
    queryFn: fetchAllAOIs,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  })
}
