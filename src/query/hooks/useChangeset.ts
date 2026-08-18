import { useQuery } from '@tanstack/react-query'
import { changesetQueryOptions } from '../options/changeset.ts'

export function useChangeset(changesetId: number | null) {
  return useQuery({
    ...changesetQueryOptions(changesetId!),
    enabled: !!changesetId,
  })
}
