import type { ReactNode } from 'react'
import { osmNoteUrl } from '../../notes/osmNoteRefs.ts'
import { useOsmNoteActions } from '../../stores/osm-note-store.ts'
import { isPlainClick } from './isPlainClick.ts'

type Props = {
  noteId: number
  className?: string
  children: ReactNode
}

/**
 * A link to the note on openstreetmap.org that opens the quick view on a plain click.
 * Cmd/ctrl/middle click and long press keep the normal link behaviour (new tab).
 */
export function OsmNoteLink({ noteId, className, children }: Props) {
  const { openNote } = useOsmNoteActions()
  return (
    <a
      href={osmNoteUrl(noteId)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title={`Show OSM note #${noteId} here`}
      onClick={(event) => {
        if (!isPlainClick(event)) return
        event.preventDefault()
        openNote(noteId)
      }}
    >
      {children}
    </a>
  )
}
