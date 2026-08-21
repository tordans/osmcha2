import { useUserDetails } from './useUserDetails.ts'

/**
 * Get trustedlist from user details.
 * The trustedlist is embedded in the user details response as the "whitelists" field.
 */
export function useTrustedlist() {
  const { data: userDetails, ...rest } = useUserDetails()

  return {
    ...rest,
    data: userDetails?.whitelists || [],
  }
}
