import { queryOptions } from '@tanstack/react-query'
import { fetchUserDetails } from '../../network/auth.ts'
import { fetchMappingTeam, fetchUserMappingTeams } from '../../network/mapping_team.ts'
import { fetchWatchList } from '../../network/osmcha_watchlist.ts'
import { cacheForever } from '../cachePolicy.ts'

export function userDetailsQueryOptions() {
  return queryOptions({
    queryKey: ['user', 'details'],
    queryFn: fetchUserDetails,
    ...cacheForever,
    retry: 3,
  })
}

export function watchlistQueryOptions() {
  return queryOptions({
    queryKey: ['watchlist'],
    queryFn: fetchWatchList,
    ...cacheForever,
    retry: 3,
  })
}

export function mappingTeamsQueryOptions(username: string) {
  return queryOptions({
    queryKey: ['mappingTeams', username],
    queryFn: () => fetchUserMappingTeams(username),
    ...cacheForever,
  })
}

export function mappingTeamQueryOptions(teamId: number) {
  return queryOptions({
    queryKey: ['mappingTeam', teamId],
    queryFn: () => fetchMappingTeam(teamId),
    ...cacheForever,
  })
}
