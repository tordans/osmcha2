import { useQuery } from '@tanstack/react-query'
import { osmNoteQueryOptions } from '../options/osmNote.ts'

/** Fetches only while `enabled`; a closed quick view must not refetch in the background. */
export function useOsmNote(noteId: number | null, enabled: boolean) {
  return useQuery({
    ...osmNoteQueryOptions(noteId ?? 0),
    enabled: enabled && noteId != null,
  })
}
