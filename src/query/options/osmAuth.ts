import { queryOptions } from '@tanstack/react-query'
import { fetchOsmUsername } from '../../notes/osmAuthClient.ts'

export function osmUsernameQueryOptions(signedIn: boolean) {
  return queryOptions({
    queryKey: ['osm', 'username', signedIn],
    queryFn: fetchOsmUsername,
    enabled: signedIn,
  })
}
