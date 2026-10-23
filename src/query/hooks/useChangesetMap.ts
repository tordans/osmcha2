import { useQuery } from '@tanstack/react-query'
import {
  changesetMapFromOverpassQueryOptions,
  changesetMapQueryOptions,
} from '../options/changeset.ts'

export function useChangesetMap(changesetId: number | null) {
  return useQuery({
    ...changesetMapQueryOptions(changesetId!),
    enabled: !!changesetId,
  })
}

/// Overpass fallback for the changeset map. It never runs on its own: call `refetch()`
/// from a user action. Shares its cache with the other readers of the same changeset.
export function useChangesetMapFromOverpass(changesetId: number | null) {
  return useQuery({
    ...changesetMapFromOverpassQueryOptions(changesetId!),
    enabled: false,
  })
}
