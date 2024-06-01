'use client'
import { Navbar, NavbarItem, NavbarSection } from '@components/core/navbar'
import { useState } from 'react'
import { DetailsChanges } from './DetailsChanges'
import { DetailsChangeset } from './DetailsChangeset'

type Props = { changeset: any }

export const Details = ({ changeset }: Props) => {
  const [panel, setPanel] = useState<'changes' | 'changeset'>('changes')

  return (
    <section className="w-80 p-2">
      <Navbar className="mb-2">
        <NavbarSection>
          <NavbarItem current={panel === 'changes'} onClick={() => setPanel('changes')}>
            Changes
          </NavbarItem>
          <NavbarItem current={panel === 'changeset'} onClick={() => setPanel('changeset')}>
            Changeset
          </NavbarItem>
        </NavbarSection>
      </Navbar>
      {panel === 'changes' && <DetailsChanges changeset={changeset} />}
      {panel === 'changeset' && <DetailsChangeset changeset={changeset} />}
    </section>
  )
}
