import { useQuery } from '@tanstack/react-query'
import { useAuthToken } from '../../stores/auth-store.ts'
import { watchlistQueryOptions } from '../options/account.ts'

export function useWatchlist() {
  const token = useAuthToken()

  return useQuery({
    ...watchlistQueryOptions(),
    enabled: !!token,
  })
}
