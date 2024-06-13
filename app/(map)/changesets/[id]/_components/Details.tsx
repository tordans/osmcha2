'use client'
import { TOsmChaChangeset } from '@app/(map)/_data/OsmChaChangeset.zod'
import { TOsmChaRealChangeset } from '@app/(map)/_data/OsmChaRealChangeset.zod'
import { TOsmOrgChangeset } from '@app/(map)/_data/OsmOrgChangeset.zod'
import { Badge } from '@app/_components/core/badge'
import { Navbar, NavbarItem, NavbarSection } from '@app/_components/core/navbar'
import { useState } from 'react'
import { CommentIndicator } from '../../../_components/Changeset/CommentIndicator'
import { DetailsChanges } from './DetailsChanges'
import { DetailsComments } from './DetailsComments'

type Props = {
  osmChaChangeset: TOsmChaChangeset
  osmChaRealChangeset: TOsmChaRealChangeset | undefined
  osmOrgChangeset: TOsmOrgChangeset
}

export const Details = ({ osmChaChangeset, osmChaRealChangeset, osmOrgChangeset }: Props) => {
  // TODO: Move this state to a nuqs URL serach param
  const [panel, setPanel] = useState<'changes' | 'discussion'>('changes')

  const changesetCount =
    osmChaChangeset.properties.create +
    osmChaChangeset.properties.modify +
    osmChaChangeset.properties.delete

  return (
    <section className="h-full overflow-y-scroll p-2">
      <Navbar className="mb-2">
        <NavbarSection>
          <NavbarItem current={panel === 'changes'} onClick={() => setPanel('changes')}>
            Changes <Badge>{changesetCount}</Badge>
          </NavbarItem>
          <NavbarItem current={panel === 'discussion'} onClick={() => setPanel('discussion')}>
            Discussion{' '}
            <CommentIndicator commentCount={osmOrgChangeset.elements[0].comments_count} />
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
