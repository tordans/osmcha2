import { findOsmNoteRefs } from '../../notes/osmNoteRefs.ts'
import { findOsmChangesetRefs } from './osmChangesetRefs.ts'

type TextSegment =
  | { type: 'text'; text: string; start: number }
  | { type: 'note' | 'changeset'; text: string; start: number; id: number }

type Kinds = { osmNotes: boolean; osmChangesets: boolean }

/**
 * Cut `text` into plain runs and OSM note and changeset references. Joined, the segments equal
 * `text`. Where two references overlap, the one that starts first wins.
 */
export function splitByTextRefs(text: string, { osmNotes, osmChangesets }: Kinds) {
  const refs = [
    ...(osmNotes ? findOsmNoteRefs(text).map((ref) => ({ ...ref, type: 'note' as const })) : []),
    ...(osmChangesets
      ? findOsmChangesetRefs(text).map((ref) => ({ ...ref, type: 'changeset' as const }))
      : []),
  ].sort((a, b) => a.start - b.start)

  const segments: TextSegment[] = []
  let cursor = 0
  for (const ref of refs) {
    if (ref.start < cursor) continue
    if (ref.start > cursor)
      segments.push({ type: 'text', text: text.slice(cursor, ref.start), start: cursor })
    segments.push({ type: ref.type, text: ref.text, start: ref.start, id: ref.id })
    cursor = ref.end
  }
  if (cursor < text.length) segments.push({ type: 'text', text: text.slice(cursor), start: cursor })
  return segments
}
