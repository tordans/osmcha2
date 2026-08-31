import { useQuery } from '@tanstack/react-query'
import { useAuthToken } from '../../stores/auth-store.ts'
import { aoiQueryOptions, allAoisQueryOptions } from '../options/aoi.ts'

export function useAOI(aoiId: string | null) {
  const token = useAuthToken()

  return useQuery({
    ...aoiQueryOptions(aoiId!),
    enabled: !!aoiId && !!token,
  })
}

export function useAllAOIs() {
  const token = useAuthToken()

  return useQuery({
    ...allAoisQueryOptions(),
    enabled: !!token,
  })
}
