import { queryOptions } from '@tanstack/react-query'
import { fetchOsmNote, OsmNoteUnavailableError } from '../../network/osmNotes.ts'
import { cacheFiveMinutes } from '../cachePolicy.ts'

/** A note from the public OSM API, cached per id. */
export function osmNoteQueryOptions(noteId: number) {
  return queryOptions({
    queryKey: ['osmNote', noteId],
    queryFn: ({ signal }) => fetchOsmNote(noteId, signal),
    ...cacheFiveMinutes,
    // A missing or hidden note stays that way; a network error may pass.
    retry: (failureCount, error) => !(error instanceof OsmNoteUnavailableError) && failureCount < 2,
  })
}
