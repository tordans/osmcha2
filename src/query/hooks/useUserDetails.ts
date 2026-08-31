import { useQuery } from '@tanstack/react-query'
import { useAuthToken } from '../../stores/auth-store.ts'
import { userDetailsQueryOptions } from '../options/account.ts'

export function useUserDetails() {
  const token = useAuthToken()

  return useQuery({
    ...userDetailsQueryOptions(),
    enabled: !!token,
  })
}
