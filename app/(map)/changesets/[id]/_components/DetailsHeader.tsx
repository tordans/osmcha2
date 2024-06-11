'use client'
import { ChangesetDescription } from '@app/(map)/_components/Changeset/ChangesetDescription'
import { RelativeTime } from '@app/(map)/_components/Changeset/RelativeTime'
import { TOsmChaChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaChangeset.zod'
import { TOsmChaUser } from '@app/(map)/_components/Changeset/zod/OsmChaUser.zod'
import { TOsmOrgUser } from '@app/(map)/_components/Changeset/zod/OsmOrgUser.zod'
import { longerEditorShortname } from '@app/(map)/_components/utils/editorShortname'
import { Badge, BadgeButton } from '@components/core/badge'
import { Button } from '@components/core/button'
import { Divider } from '@components/core/divider'
import { HandThumbDownIcon, HandThumbUpIcon } from '@heroicons/react/16/solid'
import clsx from 'clsx'
import { DropdownOpenChangeset } from './Details/DropdownOpenChangeset'
import { DropdownOpenUser } from './Details/HeaderDropdownOpenUser'

type Props = {
  osmChaChangeset: TOsmChaChangeset
  osmOrgUser: TOsmOrgUser
  osmChaUser: TOsmChaUser
}

export const DetailsHeader = ({ osmChaChangeset, osmOrgUser, osmChaUser }: Props) => {
  return (
    <header className="flex flex-col gap-1 bg-zinc-50 py-1 pl-3 pr-1">
      <div className="w-full">
        <h1 className="text-lg font-bold">Changeset #{osmChaChangeset.id}</h1>
        <p className="text-xs text-zinc-500">
          <RelativeTime date={osmChaChangeset.properties.date} /> |{' '}
          {longerEditorShortname(
            osmChaChangeset.properties.editor,
            osmChaChangeset.properties.metadata.host,
          )}
        </p>
      </div>

      <div className="mt-2 flex items-center justify-between gap-1 text-base">
        <div className="flex flex-col gap-1">
          <ChangesetDescription changeset={osmChaChangeset} />

          <div className="space-x-1">
            {osmChaChangeset.properties.reasons?.map((reason: { id: number; name: string }) => {
              return <Badge key={reason.id}>{reason.name}</Badge>
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 hover:text-zinc-800">
            <p>
              User created <RelativeTime date={osmOrgUser.user.account_created} /> |{' '}
              {osmOrgUser.user.changesets.count.toLocaleString()} edits
            </p>
            <div title="Number of changesets of this user that where marked bad/good in OSMCha before">
              <BadgeButton
                rounded="left"
                href={`/?filters={"uids":[{"label":"${osmOrgUser.user.id}","value":"${osmOrgUser.user.id}"}],"harmful":[{"label":"Show Bad only","value":true}]`}
              >
                {osmChaUser.checked_changesets.toLocaleString()}{' '}
                <HandThumbUpIcon
                  className="inline size-4 text-zinc-600"
                  aria-label="Good changesets"
                />
              </BadgeButton>
              <BadgeButton
                rounded="right"
                href={`/?filters={"uids":[{"label":"${osmOrgUser.user.id}","value":"${osmOrgUser.user.id}"}],"harmful":[{"label":"Show Good only","value":false}]'`}
              >
                <span className={clsx(osmChaUser.harmful_changesets ? 'text-orange-700' : '')}>
                  {osmChaUser.harmful_changesets.toLocaleString()}{' '}
                </span>
                <HandThumbDownIcon
                  className={clsx(
                    'inline size-4',
                    osmChaUser.harmful_changesets ? 'text-orange-500' : 'text-zinc-600',
                  )}
                  aria-label="Harmful changesets"
                />
              </BadgeButton>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 flex gap-2">
        <Button outline className="group">
          <HandThumbUpIcon
            className="inline size-4 text-zinc-600 group-hover:text-green-500"
            aria-label="Mark changesets as good"
          />
        </Button>
        <Button outline className="group">
          <HandThumbDownIcon
            className="inline size-4 text-zinc-600 group-hover:text-orange-500"
            aria-label="Mark changesets as harmful"
          />
        </Button>
        <DropdownOpenChangeset changeset={osmChaChangeset} />
        <DropdownOpenUser changeset={osmChaChangeset} />
      </div>

      <Divider className="mp-0.5 mt-1" />
    </header>
  )
}
