import { useUserDetails } from '../query/hooks/useUserDetails.ts'
import { useAuthToken } from '../stores/auth-store.ts'

/**
 * Hook for accessing auth state and user details.
 * Uses Zustand for token storage and TanStack Query for user data.
 */
export function useAuth() {
  const token = useAuthToken()
  const userQuery = useUserDetails()

  return {
    token,
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    isAuthenticated: !!token && userQuery.isSuccess,
  }
}
