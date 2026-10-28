import { osmNoteIds } from '../../notes/osmNoteRefs.ts'
import { useOsmNoteActions } from '../../stores/osm-note-store.ts'
import { BadgeButton } from '../ui/badge.tsx'

/**
 * One chip per OSM note the text refers to, under the comment, in case the link in the
 * text is easy to miss. Tapping a chip opens the note quick view.
 */
export function OsmNoteChips({ text }: { text: string | null | undefined }) {
  const { openNote } = useOsmNoteActions()
  const ids = osmNoteIds(text)
  if (ids.length === 0) return null
  return (
    <ul aria-label="OSM notes in the comment" className="flex flex-wrap items-center gap-1">
      {ids.map((id) => (
        <li key={id}>
          <BadgeButton
            type="button"
            color="blue"
            aria-label={`Show OSM note ${id}`}
            onClick={() => openNote(id)}
            className="cursor-pointer touch-manipulation select-none"
          >
            OSM note #{id}
          </BadgeButton>
        </li>
      ))}
    </ul>
  )
}
