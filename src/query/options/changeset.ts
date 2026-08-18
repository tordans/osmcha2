import { queryOptions } from '@tanstack/react-query'
import { fetchAndParseAugmentedDiff } from '../../network/changeset.ts'
import { fetchChangesetMetadata } from '../../network/openstreetmap.ts'
import { makeApiRequest, handleResponse } from '../../network/request.ts'

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
    staleTime: 10 * 60 * 1000,
    retry: 3,
  })
}

export function changesetMapQueryOptions(changesetId: number) {
  return queryOptions({
    queryKey: ['changesetMap', changesetId],
    queryFn: async () => {
      const [metadata, adiff] = await Promise.all([
        fetchChangesetMetadata(changesetId),
        fetchAndParseAugmentedDiff(changesetId),
      ])

      return { metadata, adiff }
    },
    staleTime: 30 * 60 * 1000,
    retry: 3,
  })
}
