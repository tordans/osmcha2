import { useUserDetails } from '../query/hooks/useUserDetails.ts'
import { useWatchlist } from '../query/hooks/useWatchlist.ts'

export const useIsUserListed = (
  username: string,
  uid: number,
  _token?: string | null,
): [boolean, boolean] => {
  const { data: userDetails } = useUserDetails()
  const { data: watchlist = [] } = useWatchlist()

  // Trustedlist comes from user details, not a separate API call
  const trustedlist = userDetails?.whitelists || []

  const isInTrustedlist = Array.isArray(trustedlist) && trustedlist.includes(username)
  // The API sends `uid` as a string or a number; compare as strings so both match.
  const isInWatchlist =
    Array.isArray(watchlist) && watchlist.some((user) => String(user.uid) === String(uid))

  return [isInTrustedlist, isInWatchlist]
}
