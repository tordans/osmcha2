'use client'
import { TOsmChaChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaChangeset.zod'
import { TOsmOrgChangeset } from '@app/(map)/_components/Changeset/zod/OsmOrgChangeset.zod'
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
  osmOrgChangeset: TOsmOrgChangeset
}

export const Details = ({ osmChaChangeset, osmOrgChangeset }: Props) => {
  const [panel, setPanel] = useState<'changes' | 'changeset'>('changes')

  return (
    <section className="w-80 p-2">
      <Navbar className="mb-2">
        <NavbarSection>
          <NavbarItem current={panel === 'changes'} onClick={() => setPanel('changes')}>
            Changes
          </NavbarItem>
          <NavbarItem current={panel === 'changeset'} onClick={() => setPanel('changeset')}>
            Discussion
            <ChangesetCommentIndicator commentCount={osmChaChangeset.properties.comments_count} />
            <ChangesetNoCommentIndicator commentCount={osmChaChangeset.properties.comments_count} />
          </NavbarItem>
        </NavbarSection>
      </Navbar>
      {panel === 'changes' && <DetailsChanges changeset={osmChaChangeset} />}
      {panel === 'changeset' && (
        <DetailsComments discussions={osmOrgChangeset.elements[0].discussion} />
      )}
    </section>
  )
}
