import type { ReactNode } from 'react'
import { searchWithoutMap } from '../../routing/mapParam.ts'
import { RouterLink } from '../../routing/RouterLink.tsx'
import { getOsmNoteActions } from '../../stores/osm-note-store.ts'
import { isPlainClick } from '../osm_notes/isPlainClick.ts'

type Props = {
  changesetId: number
  className?: string
  children: ReactNode
}

/**
 * Opens a referenced changeset in OSMCha instead of on openstreetmap.org.
 * A push navigation: browser back returns to the changeset, map view and selection before.
 */
export function OsmChangesetLink({ changesetId, className, children }: Props) {
  return (
    <RouterLink
      to="/changesets/$id"
      params={{ id: changesetId }}
      search={(prev) => searchWithoutMap(prev)}
      className={className}
      title={`Open changeset #${changesetId} in OSMCha`}
      onClick={(event) => {
        // A reference in the OSM note quick view: the dialog would cover the new changeset.
        if (isPlainClick(event)) getOsmNoteActions().close()
      }}
    >
      {children}
    </RouterLink>
  )
}
