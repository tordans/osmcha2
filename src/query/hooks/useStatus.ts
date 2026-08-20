import { useQuery } from '@tanstack/react-query'
import { getStatus } from '../../network/status.ts'
import { cacheFiveMinutes } from '../cachePolicy.ts'

export function useStatus() {
  return useQuery({
    queryKey: ['status'],
    queryFn: getStatus,
    ...cacheFiveMinutes,
    retry: 3,
  })
}
