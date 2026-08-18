import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../stores/authStore.ts'
import { watchlistQueryOptions } from '../options/account.ts'

export function useWatchlist() {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    ...watchlistQueryOptions(),
    enabled: !!token,
  })
}
