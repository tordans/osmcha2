'use client'
import { TOsmChaChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaChangeset.zod'
import { TOsmChaRealChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaRealChangeset.zod'
import { TOsmOrgChangeset } from '@app/(map)/_components/Changeset/zod/OsmOrgChangeset.zod'
import { Badge } from '@components/core/badge'
import { Navbar, NavbarItem, NavbarSection } from '@components/core/navbar'
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
  const [panel, setPanel] = useState<'changes' | 'changeset'>('changes')

  return (
    <section className="h-full overflow-y-scroll p-2">
      <Navbar className="mb-2">
        <NavbarSection>
          <NavbarItem current={panel === 'changes'} onClick={() => setPanel('changes')}>
            Changes <Badge>{osmChaRealChangeset.metadata.changes_count}</Badge>
          </NavbarItem>
          <NavbarItem current={panel === 'changeset'} onClick={() => setPanel('changeset')}>
            Discussion
            <ChangesetCommentIndicator commentCount={osmChaChangeset.properties.comments_count} />
            <ChangesetNoCommentIndicator commentCount={osmChaChangeset.properties.comments_count} />
          </NavbarItem>
        </NavbarSection>
      </Navbar>
      {panel === 'changes' && <DetailsChanges osmChaRealChangeset={osmChaRealChangeset} />}
      {panel === 'changeset' && (
        <DetailsComments discussions={osmOrgChangeset.elements[0].discussion} />
      )}
    </section>
  )
}
