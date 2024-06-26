'use client'
import { TOsmChaChangeset } from '@app/(map)/_data/OsmChaChangeset.zod'
import { TOsmChaRealChangeset } from '@app/(map)/_data/OsmChaRealChangeset.zod'
import { TOsmOrgChangeset } from '@app/(map)/_data/OsmOrgChangeset.zod'
import { Badge } from '@app/_components/core/badge'
import { Navbar, NavbarItem, NavbarSection } from '@app/_components/core/navbar'
import { parseAsStringEnum, useQueryState } from 'nuqs'
import {
  CommentIndicator,
  NoCommentIndicator,
} from '../../../_components/Changeset/CommentIndicator'
import { DetailsChanges } from './DetailsChanges'
import { DetailsComments } from './DetailsComments'

type Props = {
  osmChaChangeset: TOsmChaChangeset
  osmChaRealChangeset: TOsmChaRealChangeset | undefined
  osmOrgChangeset: TOsmOrgChangeset
}

export const Details = ({ osmChaChangeset, osmChaRealChangeset, osmOrgChangeset }: Props) => {
  const [panel, setPanel] = useQueryState(
    'details',
    parseAsStringEnum(['changes', 'comments'])
      .withDefault('changes')
      .withOptions({ history: 'replace' }),
  )

  const changesetCount =
    osmChaChangeset.properties.create +
    osmChaChangeset.properties.modify +
    osmChaChangeset.properties.delete
  const commentCount = osmOrgChangeset.elements[0].comments_count

  return (
    <section className="h-full overflow-y-scroll p-2">
      <Navbar className="mb-2">
        <NavbarSection>
          <NavbarItem current={panel === 'changes'} onClick={() => setPanel('changes')}>
            Changes <Badge>{changesetCount}</Badge>
          </NavbarItem>
          <NavbarItem current={panel === 'comments'} onClick={() => setPanel('comments')}>
            Discussion{' '}
            {commentCount ? (
              <CommentIndicator commentCount={commentCount} />
            ) : (
              <NoCommentIndicator />
            )}
          </NavbarItem>
        </NavbarSection>
      </Navbar>
      {panel === 'changes' && <DetailsChanges osmChaRealChangeset={osmChaRealChangeset} />}
      {panel === 'comments' && <DetailsComments osmOrgChangeset={osmOrgChangeset} />}
    </section>
  )
}
