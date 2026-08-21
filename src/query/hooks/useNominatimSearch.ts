import { useQuery } from '@tanstack/react-query'
import { nominatimSearch, type NominatimPlace } from '../../network/nominatim.ts'
import { cacheForever } from '../cachePolicy.ts'

export type { NominatimPlace }

export function useNominatimSearch(query: string, type: string, enabled: boolean) {
  return useQuery({
    queryKey: ['nominatim', type, query],
    queryFn: () => nominatimSearch(query, type),
    enabled,
    ...cacheForever,
  })
}
