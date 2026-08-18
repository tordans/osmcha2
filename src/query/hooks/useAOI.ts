import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../stores/authStore.ts'
import { aoiQueryOptions, allAoisQueryOptions } from '../options/aoi.ts'

export function useAOI(aoiId: string | null) {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    ...aoiQueryOptions(aoiId!),
    enabled: !!aoiId && !!token,
  })
}

export function useAllAOIs() {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    ...allAoisQueryOptions(),
    enabled: !!token,
  })
}
