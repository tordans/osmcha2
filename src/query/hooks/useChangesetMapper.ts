import { useQuery } from '@tanstack/react-query'
import { getUserDetails } from '../../network/openstreetmap.ts'
import { getUsers } from '../../network/whosthat.ts'
import { cacheForever } from '../cachePolicy.ts'

export function useChangesetMapper(uid: number | string | null | undefined, enabled: boolean) {
  const numericUid = Number(uid) || 0
  const canLoad = enabled && numericUid > 0

  const userDetailsQuery = useQuery({
    queryKey: ['osm-user', numericUid],
    queryFn: () => getUserDetails(numericUid),
    enabled: canLoad,
    ...cacheForever,
  })

  const aliasesQuery = useQuery({
    queryKey: ['whosthat', numericUid],
    queryFn: async () => {
      const users = await getUsers(numericUid)
      return (users[0]?.names as string[] | undefined) ?? []
    },
    enabled: canLoad,
    ...cacheForever,
  })

  return {
    userDetails: userDetailsQuery.data ?? null,
    whosThat: aliasesQuery.data ?? [],
  }
}
