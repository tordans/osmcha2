import { queryOptions } from '@tanstack/react-query'
import { fetchUserDetails } from '../../network/auth.ts'
import { fetchMappingTeam, fetchUserMappingTeams } from '../../network/mapping_team.ts'
import { fetchWatchList } from '../../network/osmcha_watchlist.ts'

export function userDetailsQueryOptions() {
  return queryOptions({
    queryKey: ['user', 'details'],
    queryFn: fetchUserDetails,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  })
}

export function watchlistQueryOptions() {
  return queryOptions({
    queryKey: ['watchlist'],
    queryFn: fetchWatchList,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  })
}

export function mappingTeamsQueryOptions(username: string) {
  return queryOptions({
    queryKey: ['mappingTeams', username],
    queryFn: () => fetchUserMappingTeams(username),
    staleTime: 5 * 60 * 1000,
  })
}

export function mappingTeamQueryOptions(teamId: number) {
  return queryOptions({
    queryKey: ['mappingTeam', teamId],
    queryFn: () => fetchMappingTeam(teamId),
    staleTime: 5 * 60 * 1000,
  })
}
