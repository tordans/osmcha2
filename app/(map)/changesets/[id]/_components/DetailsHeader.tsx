'use client'
import { BadgeCheckedBy } from '@app/(map)/_components/Changeset/BadgeCheckedBy'
import { BadgesCheckTags, hasResolvedTags } from '@app/(map)/_components/Changeset/BadgesCheckTags'
import { BadgesReasonsFlagged } from '@app/(map)/_components/Changeset/BadgesReasonsFlagged'
import { ChangesetDescriptionWithLinkify } from '@app/(map)/_components/Changeset/ChangesetDescription'
import { RelativeTime } from '@app/(map)/_components/Changeset/RelativeTime'
import { Abbr } from '@app/(map)/_components/text/Abbr'
import { longerEditorShortname } from '@app/(map)/_components/utils/editorShortname'
import { TOsmChaChangeset } from '@app/(map)/_data/OsmChaChangeset.zod'
import { TOsmChaUser } from '@app/(map)/_data/OsmChaUser.zod'
import { TOsmOrgUser } from '@app/(map)/_data/OsmOrgUser.zod'
import { Badge } from '@app/_components/core/badge'
import { Button } from '@app/_components/core/button'
import { Divider } from '@app/_components/core/divider'
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
      <DropdownOpenChangeset changeset={osmChaChangeset}>
        <div className="flex flex-col justify-start text-start">
          <h1 className="text-lg font-bold">Changeset #{osmChaChangeset.id}</h1>
          <p className="-mt-0.5 text-xs text-zinc-500">
            <RelativeTime date={osmChaChangeset.properties.date} /> |{' '}
            <Abbr
              title={`Editor ${osmChaChangeset.properties.editor} ${osmChaChangeset.properties.metadata.host ? `on ${osmChaChangeset.properties.metadata.host}` : ''}`}
            >
              {longerEditorShortname(
                osmChaChangeset.properties.editor,
                osmChaChangeset.properties.metadata.host,
              )}
            </Abbr>
          </p>
        </div>
      </DropdownOpenChangeset>

      <DropdownOpenUser
        changeset={osmChaChangeset}
        userId={osmOrgUser.user.id}
        checkedGoodCount={osmChaUser.checked_changesets}
        checkedBadCount={osmChaUser.harmful_changesets}
        totalCount={osmOrgUser.user.changesets.count}
      >
        <div className="flex w-full items-center justify-between text-xs text-zinc-500 hover:text-zinc-800">
          <p>
            User created <RelativeTime date={osmOrgUser.user.account_created} /> |{' '}
            {osmOrgUser.user.changesets.count.toLocaleString()} edits
          </p>
          <div title="Number of changesets of this user that where marked bad/good in OSMCha before">
            <Badge rounded="left">
              {osmChaUser.checked_changesets.toLocaleString()}{' '}
              <HandThumbUpIcon
                className="inline size-4 text-zinc-600"
                aria-label="Good changesets"
              />
            </Badge>
            <Badge rounded="right">
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
            </Badge>
          </div>
        </div>
      </DropdownOpenUser>

      <div className="mt-2 flex flex-col gap-1 text-base">
        <ChangesetDescriptionWithLinkify changeset={osmChaChangeset} />
        <BadgesReasonsFlagged reasons={osmChaChangeset.properties.reasons} />
      </div>

      <div className="mt-2 flex items-center gap-2">
        {osmChaChangeset.properties.checked ? (
          <>
            <BadgeCheckedBy
              checkDate={osmChaChangeset.properties.check_date}
              harmful={osmChaChangeset.properties.harmful}
              user={osmChaChangeset.properties.check_user}
              resolved={hasResolvedTags(osmChaChangeset.properties.tags)}
            />
            <BadgesCheckTags tags={osmChaChangeset.properties.tags} />
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      <Divider className="mp-0.5 mt-1" />
    </header>
  )
}
