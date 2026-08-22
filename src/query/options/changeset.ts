import { queryOptions } from '@tanstack/react-query'
import { fetchAndParseAugmentedDiff } from '../../network/changeset.ts'
import { fetchChangesetMetadata } from '../../network/openstreetmap.ts'
import { handleResponse, isMissingCredentialsError, makeApiRequest } from '../../network/request.ts'
import { cacheChangesetMap, cacheDiscussion, cacheForever } from '../cachePolicy.ts'

export function changesetQueryOptions(changesetId: number) {
  return queryOptions({
    queryKey: ['changeset', changesetId],
    queryFn: async () => {
      const req = makeApiRequest(`/changesets/${changesetId}/`)
      const res = await fetch(req)
      if (res.status === 404) {
        throw new Error('Changeset not found')
      }
      return handleResponse(res)
    },
    ...cacheForever,
    retry: (failureCount, error) => {
      if (isMissingCredentialsError(error)) return false
      return failureCount < 3
    },
  })
}

export function changesetMapQueryOptions(changesetId: number) {
  return queryOptions({
    queryKey: ['changesetMap', changesetId],
    queryFn: async () => {
      const adiff = await fetchAndParseAugmentedDiff(changesetId)
      return { adiff }
    },
    ...cacheChangesetMap,
    retry: 3,
  })
}

export function changesetDiscussionQueryOptions(changesetId: number) {
  return queryOptions({
    queryKey: ['changesetDiscussion', changesetId],
    queryFn: () => fetchChangesetMetadata(changesetId),
    ...cacheDiscussion,
    retry: 3,
  })
}
