import { useEffect } from 'react'
import { toast } from 'sonner'
import { useStatus } from '../query/hooks/useStatus.ts'
import { useUserDetails } from '../query/hooks/useUserDetails.ts'
import { useAuthToken } from '../stores/auth-store.ts'

/**
 * Hook for accessing auth state and user details.
 * Uses Zustand for token storage and TanStack Query for user data.
 */
export function useAuth() {
  const token = useAuthToken()
  const userQuery = useUserDetails()
  const statusQuery = useStatus()

  useEffect(
    function toastOsmchaOperationalStatus() {
      if (statusQuery.data && statusQuery.data.status !== 'success') {
        toast.warning('OSMCha Status', {
          description: statusQuery.data.message,
          duration: 20000,
        })
      }
    },
    [statusQuery.data],
  )

  return {
    token,
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    isAuthenticated: !!token && userQuery.isSuccess,
  }
}
