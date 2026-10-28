import { useQuery } from '@tanstack/react-query'
import { resolveTrafficSigns } from '../../components/traffic_signs/resolveTrafficSigns.ts'
import { cacheTrafficSigns } from '../cachePolicy.ts'

/** The signs of one `traffic_sign` value; the catalogue loads with the first value that asks for it. */
export function useTrafficSigns(value: string) {
  return useQuery({
    queryKey: ['trafficSigns', value],
    queryFn: () => resolveTrafficSigns(value),
    ...cacheTrafficSigns,
    retry: false,
  })
}
