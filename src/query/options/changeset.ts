import { queryOptions } from '@tanstack/react-query'
import {
  AdiffNotFoundError,
  changesetFeatureSchema,
  fetchAndParseAugmentedDiff,
  fetchAndParseAugmentedDiffFromOverpass,
} from '../../network/changeset.ts'
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
      return changesetFeatureSchema.parse(await handleResponse(res))
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
    // A missing adiff will not appear by retrying right away; the user can retry or load from Overpass.
    retry: (failureCount, error) => {
      if (error instanceof AdiffNotFoundError) return false
      return failureCount < 3
    },
  })
}

/// Overpass fallback for a changeset map. Only enabled after the user asks for it,
/// see useChangesetMapFromOverpass. Never retried automatically.
export function changesetMapFromOverpassQueryOptions(changesetId: number) {
  return queryOptions({
    queryKey: ['changesetMapOverpass', changesetId],
    queryFn: async () => {
      const adiff = await fetchAndParseAugmentedDiffFromOverpass(changesetId)
      return { adiff }
    },
    ...cacheChangesetMap,
    retry: false,
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
