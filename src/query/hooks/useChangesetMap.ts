import { useQuery } from '@tanstack/react-query'
import { changesetMapQueryOptions } from '../options/changeset.ts'

export function useChangesetMap(changesetId: number | null) {
  return useQuery({
    ...changesetMapQueryOptions(changesetId!),
    enabled: !!changesetId,
  })
}
