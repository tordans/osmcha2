'use client'
import { RelativeTime } from '@app/(map)/_components/Changeset/RelativeTime'
import { TOsmChaChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaChangeset.zod'
import { TOsmChaUser } from '@app/(map)/_components/Changeset/zod/OsmChaUser.zod'
import { TOsmOrgUser } from '@app/(map)/_components/Changeset/zod/OsmOrgUser.zod'
import { editorShortname } from '@app/(map)/_components/utils/editorShortname'
import { Badge } from '@components/core/badge'
import { Button } from '@components/core/button'
import { Divider } from '@components/core/divider'
import { Transition } from '@headlessui/react'
import { HandThumbDownIcon, HandThumbUpIcon, UserIcon } from '@heroicons/react/16/solid'
import { useState } from 'react'
import { DropdownOpenChangeset } from './Details/DropdownOpenChangeset'
import { DropdownOpenUser } from './Details/HeaderDropdownOpenUser'

type Props = {
  osmChaChangeset: TOsmChaChangeset
  osmOrgUser: TOsmOrgUser
  osmChaUser: TOsmChaUser
}

export const DetailsHeader = ({ osmChaChangeset, osmOrgUser, osmChaUser }: Props) => {
  const [showUserDetails, setShowUserDetails] = useState(false)

  return (
    <header className="flex flex-col gap-1 bg-zinc-50 py-1 pl-3 pr-1">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold">Changeset #{osmChaChangeset.id}</h1>
          <div className="flex w-full items-center justify-start gap-2 text-xs text-zinc-500">
            <span>
              <RelativeTime createdAt={osmChaChangeset.properties.date} />
            </span>
            <span>{editorShortname(osmChaChangeset.properties.editor)}</span>
          </div>
        </div>
        <DropdownOpenChangeset changeset={osmChaChangeset} />
      </div>
      <div className="flex items-center justify-between gap-1 text-base">
        <div className="flex flex-col gap-1">
          <div className="hyphens-auto leading-tight">
            <strong className="font-semibold">{osmChaChangeset.properties.user}:</strong>{' '}
            {osmChaChangeset.properties.comment}
          </div>

          {osmChaChangeset.properties.checked ? (
            <div>
              {osmChaChangeset.properties.harmful ? (
                <HandThumbDownIcon className="size-4" />
              ) : (
                <HandThumbUpIcon className="size-4" />
              )}{' '}
              by {osmChaChangeset.properties.check_user}
            </div>
          ) : (
            <div className="space-x-1">
              {osmChaChangeset.properties.reasons?.map((reason: { id: number; name: string }) => {
                return <Badge key={reason.id}>{reason.name}</Badge>
              })}
            </div>
          )}
        </div>
      </div>

      <Divider className="mp-0.5 mt-1" />

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
        <DropdownOpenUser changeset={osmChaChangeset} />
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
          {osmOrgUser.user.changesets.count.toLocaleString()} edits
          <br />
          {/* TODO: Addd Link https://osmcha.org/?filters={"uids":[{"label":"{osmOrgUser.user.id}","value":"{osmOrgUser.user.id}"}],"harmful":[{"label":"Show Bad only","value":true}],"date__gte":[{"label":"","value":""}]} */}
          {/* TODO: Addd Link 'https://osmcha.org/?filters={"uids":[{"label":"{osmOrgUser.user.id}","value":"{osmOrgUser.user.id}"}],"harmful":[{"label":"Show Good only","value":false}],"date__gte":[{"label":"","value":""}]}' */}
          {osmChaUser.harmful_changesets.toLocaleString()} Bad and{' '}
          {osmChaUser.checked_changesets.toLocaleString()} Good changesets
        </p>
      </Transition>
    </header>
  )
}
