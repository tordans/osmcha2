import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../stores/authStore.ts'
import { userDetailsQueryOptions } from '../options/account.ts'

export function useUserDetails() {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    ...userDetailsQueryOptions(),
    enabled: !!token,
  })
}
