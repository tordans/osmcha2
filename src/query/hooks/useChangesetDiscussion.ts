import { useQuery } from '@tanstack/react-query'
import { DISCUSSION_STALE_MS } from '../cachePolicy.ts'
import { changesetDiscussionQueryOptions } from '../options/changeset.ts'

export function useChangesetDiscussion(
  changesetId: number | null,
  { pollWhileActive = false }: { pollWhileActive?: boolean } = {},
) {
  return useQuery({
    ...changesetDiscussionQueryOptions(changesetId!),
    enabled: !!changesetId,
    refetchInterval: pollWhileActive ? DISCUSSION_STALE_MS : false,
  })
}
