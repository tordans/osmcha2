'use client'
import { RelativeTime } from '@app/(map)/_components/Changeset/RelativeTime'
import { TOsmChaChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaChangeset.zod'
import { TOsmChaUser } from '@app/(map)/_components/Changeset/zod/OsmChaUser.zod'
import { TOsmOrgUser } from '@app/(map)/_components/Changeset/zod/OsmOrgUser.zod'
import { editorShortname } from '@app/(map)/_components/utils/editorShortname'
import { Button } from '@components/core/button'
import { Transition } from '@headlessui/react'
import { ClockIcon, PencilSquareIcon, UserIcon } from '@heroicons/react/16/solid'
import { useState } from 'react'
import { HeaderOpenInButton } from './HeaderOpenInButton'

type Props = {
  osmChaChangeset: TOsmChaChangeset
  osmOrgUser: TOsmOrgUser
  osmChaUser: TOsmChaUser
}

export const DetailsHeader = ({ osmChaChangeset, osmOrgUser, osmChaUser }: Props) => {
  const [showUserDetails, setShowUserDetails] = useState(false)

  return (
    <header className="flex flex-col gap-1 bg-zinc-50 px-3 py-1">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-semibold">Changeset #{osmChaChangeset.id}</h1>
        <HeaderOpenInButton changeset={osmChaChangeset} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button
          className="flex items-center gap-1"
          plain
          current={showUserDetails}
          onClick={() => setShowUserDetails((prev) => !prev)}
        >
          <UserIcon className="size-4" aria-hidden />
          {osmChaChangeset.properties.user}
        </Button>

        <div className="flex items-center gap-1">
          <ClockIcon className="size-4" aria-hidden />
          <RelativeTime createdAt={osmChaChangeset.properties.date} />
        </div>

        <div className="flex items-center gap-1">
          <PencilSquareIcon className="size-4" aria-hidden />
          <abbr title={osmChaChangeset.properties.editor} className="cursor-help">
            {editorShortname(osmChaChangeset.properties.editor)}
          </abbr>
        </div>
      </div>
      <Transition
        show={showUserDetails}
        enter="duration-200 ease-out"
        enterFrom="opacity-0 -translate-y-6"
        enterTo="opacity-100 translate-y-0"
        leave="duration-300 ease-out"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 -translate-y-6"
      >
        <p className="text-sm">
          Registered <RelativeTime createdAt={osmOrgUser.user.account_created} /> |{' '}
          {osmOrgUser.user.changesets.count} edits
          <br />
          {/* TODO: Addd Link https://osmcha.org/?filters={"uids":[{"label":"{osmOrgUser.user.id}","value":"{osmOrgUser.user.id}"}],"harmful":[{"label":"Show Bad only","value":true}],"date__gte":[{"label":"","value":""}]} */}
          {/* TODO: Addd Link 'https://osmcha.org/?filters={"uids":[{"label":"{osmOrgUser.user.id}","value":"{osmOrgUser.user.id}"}],"harmful":[{"label":"Show Good only","value":false}],"date__gte":[{"label":"","value":""}]}' */}
          {osmChaUser.harmful_changesets} Bad and {osmChaUser.checked_changesets} Good changesets
        </p>
      </Transition>
    </header>
  )
}
