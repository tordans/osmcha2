'use client'
import { Badge } from '@components/core/badge'
import { Navbar, NavbarItem, NavbarSection } from '@components/core/navbar'
import { TOsmChaChangeset } from '@components/zod/OsmChaChangeset.zod'
import { TOsmChaRealChangeset } from '@components/zod/OsmChaRealChangeset.zod'
import { TOsmOrgChangeset } from '@components/zod/OsmOrgChangeset.zod'
import { useState } from 'react'
import {
  ChangesetCommentIndicator,
  ChangesetNoCommentIndicator,
} from '../../../_components/Changeset/CommentIndicator'
import { DetailsChanges } from './DetailsChanges'
import { DetailsComments } from './DetailsComments'

type Props = {
  osmChaChangeset: TOsmChaChangeset
  osmChaRealChangeset: TOsmChaRealChangeset
  osmOrgChangeset: TOsmOrgChangeset
}

export const Details = ({ osmChaChangeset, osmChaRealChangeset, osmOrgChangeset }: Props) => {
  const [panel, setPanel] = useState<'changes' | 'discussion'>('changes')

  return (
    <section className="h-full overflow-y-scroll p-2">
      <Navbar className="mb-2">
        <NavbarSection>
          <NavbarItem current={panel === 'changes'} onClick={() => setPanel('changes')}>
            Changes <Badge>{osmChaRealChangeset.metadata.changes_count}</Badge>
          </NavbarItem>
          <NavbarItem current={panel === 'discussion'} onClick={() => setPanel('discussion')}>
            Discussion
            <ChangesetCommentIndicator commentCount={osmChaChangeset.properties.comments_count} />
            <ChangesetNoCommentIndicator commentCount={osmChaChangeset.properties.comments_count} />
          </NavbarItem>
        </NavbarSection>
      </Navbar>
      {panel === 'changes' && <DetailsChanges osmChaRealChangeset={osmChaRealChangeset} />}
      {panel === 'discussion' && (
        <DetailsComments discussions={osmOrgChangeset.elements[0].discussion} />
      )}
    </section>
  )
}
