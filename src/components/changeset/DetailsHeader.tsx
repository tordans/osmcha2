import {
  ChevronDownIcon,
  ExclamationTriangleIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
  StarIcon,
  XMarkIcon,
} from '@heroicons/react/16/solid'
import clsx from 'clsx'
import { getRouteApi } from '@tanstack/react-router'
import { parse } from 'date-fns'
import Linkify from 'linkify-react'
import { useHotkeys } from '@tanstack/react-hotkeys'
import { toast } from 'sonner'
import {
  OPEN_IN_ACHAVI,
  OPEN_IN_HDYC,
  OPEN_IN_ID,
  OPEN_IN_JOSM,
  OPEN_IN_LEVEL0,
  OPEN_IN_OSM,
  VERIFY_BAD,
  VERIFY_CLEAR,
  VERIFY_GOOD,
} from '../../config/bindings.ts'
import { useAuth } from '../../hooks/useAuth.ts'
import { useIsUserListed } from '../../hooks/useIsUserListed.ts'
import { useMarkHarmful } from '../../query/hooks/useMarkHarmful.ts'
import { parseMapParam } from '../../routing/mapParam.ts'
import { editorShortname } from '../list/editorShortname.ts'
import { RelativeTime } from '../relative_time.tsx'
import { Badge } from '../ui/badge.tsx'
import { Button } from '../ui/button.tsx'
import { Divider } from '../ui/divider.tsx'
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownHeading,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
} from '../ui/dropdown.tsx'
import { Tags } from './tags.tsx'
import { User } from './user.tsx'
import { hdycUrl, openExternal, openInUrls } from './openInUrls.ts'

const changesetRouteApi = getRouteApi('/changesets/$id')

const RESOLVED_TAG_ID = 9

type NamedTag = { id?: number; name: string }

export type ReviewUserDetails = {
  uid?: number | string
  name?: string
  img?: string
  accountCreated?: string
  count?: number
  changesets_in_osmcha?: number
  checked_changesets?: number
  harmful_changesets?: number
  description?: string
}

export type ReviewChangeset = {
  properties?: {
    user?: string
    uid?: number | string
    date?: string
    editor?: string | null
    comment?: string | null
    checked?: boolean
    check_user?: string | null
    check_date?: string | null
    harmful?: boolean | null
    reasons?: NamedTag[]
    tags?: NamedTag[]
    metadata?: { host?: string }
  }
}

function parseChangesetDate(date: string): Date {
  const parsed = parse(date, "yyyy-MM-dd'T'HH:mm:ssX", new Date())
  return Number.isNaN(parsed.getTime()) ? new Date(date) : parsed
}

function hasResolvedTag(tags: NamedTag[]) {
  return tags.some((tag) => tag.id === RESOLVED_TAG_ID)
}

type DetailsHeaderProps = {
  changesetId: number
  currentChangeset: ReviewChangeset
  userDetails?: ReviewUserDetails | null
  whosThat?: string[]
  userOpen?: boolean
  onUserOpenChange?: (open: boolean) => void
}

export function DetailsHeader({
  changesetId,
  currentChangeset,
  userDetails,
  whosThat = [],
  userOpen = false,
  onUserOpenChange,
}: DetailsHeaderProps) {
  const { map } = changesetRouteApi.useSearch()
  const { token, user } = useAuth()
  const username = (user as { username?: string } | undefined)?.username
  const markHarmfulMutation = useMarkHarmful()
  const properties = currentChangeset.properties ?? {}
  const osmUser = properties.user ?? userDetails?.name ?? 'OSM User'
  const uid = Number(properties.uid ?? userDetails?.uid) || 0
  const [isInTrustedlist, isInWatchlist] = useIsUserListed(osmUser, uid, token)
  const urls = openInUrls(changesetId, parseMapParam(map ?? ''))
  const tags = properties.tags ?? []
  const reasons = properties.reasons ?? []
  const checked = Boolean(properties.checked)
  const harmful = properties.harmful
  const resolved = hasResolvedTag(tags)
  const editorLabel = editorShortname(properties.editor)
  const changesetDate = properties.date ? parseChangesetDate(properties.date) : null
  const accountCreated = userDetails?.accountCreated
    ? parseChangesetDate(userDetails.accountCreated)
    : null
  const editCount = userDetails?.count ?? 0
  const checkedGood = Math.max(
    0,
    (userDetails?.checked_changesets ?? 0) - (userDetails?.harmful_changesets ?? 0),
  )
  const checkedBad = userDetails?.harmful_changesets ?? 0

  function handleMarkHarmful(value: boolean | -1) {
    if (!token) {
      toast.error('You must be logged in to mark changesets')
      return
    }
    if (!username) {
      toast.error('Username not available')
      return
    }
    markHarmfulMutation.mutate({
      changesetId,
      harmful: value,
      username,
    })
  }

  function openHdyc() {
    if (osmUser) openExternal(hdycUrl(osmUser))
  }

  useHotkeys([
    ...VERIFY_BAD.hotkeys.map((hotkey) => ({
      hotkey,
      callback: () => handleMarkHarmful(true),
    })),
    ...VERIFY_CLEAR.hotkeys.map((hotkey) => ({
      hotkey,
      callback: () => handleMarkHarmful(-1),
    })),
    ...VERIFY_GOOD.hotkeys.map((hotkey) => ({
      hotkey,
      callback: () => handleMarkHarmful(false),
    })),
    ...OPEN_IN_JOSM.hotkeys.map((hotkey) => ({
      hotkey,
      callback: () => openExternal(urls.josm),
    })),
    ...OPEN_IN_ID.hotkeys.map((hotkey) => ({
      hotkey,
      callback: () => openExternal(urls.id),
    })),
    ...OPEN_IN_OSM.hotkeys.map((hotkey) => ({
      hotkey,
      callback: () => openExternal(urls.osm),
    })),
    ...OPEN_IN_LEVEL0.hotkeys.map((hotkey) => ({
      hotkey,
      callback: () => openExternal(urls.level0),
    })),
    ...OPEN_IN_ACHAVI.hotkeys.map((hotkey) => ({
      hotkey,
      callback: () => openExternal(urls.achavi),
    })),
    ...OPEN_IN_HDYC.hotkeys.map((hotkey) => ({
      hotkey,
      callback: openHdyc,
    })),
  ])

  return (
    <header className="flex flex-col gap-1 bg-zinc-50 py-1 pr-1 pl-3">
      <Dropdown>
        <DropdownButton
          outline
          className="flex min-h-11 w-full cursor-pointer items-center justify-between p-0 touch-manipulation select-none"
        >
          <div className="flex flex-col justify-start text-start">
            <h1 className="text-lg font-bold">Changeset #{changesetId}</h1>
            <p className="-mt-0.5 text-xs text-zinc-500">
              {changesetDate ? <RelativeTime datetime={changesetDate} /> : 'Unknown date'}
              {' | '}
              <abbr
                title={`Editor ${properties.editor ?? 'unknown'}${
                  properties.metadata?.host ? ` on ${properties.metadata.host}` : ''
                }`}
              >
                {editorLabel}
              </abbr>
            </p>
          </div>
          <ChevronDownIcon data-slot="icon" />
        </DropdownButton>
        <DropdownMenu anchor="bottom start">
          <DropdownItem href={urls.osm} target="_blank" rel="noopener noreferrer">
            OSM Website
          </DropdownItem>
          <DropdownDivider />
          <DropdownSection>
            <DropdownHeading>Tools</DropdownHeading>
            <DropdownItem href={urls.achavi} target="_blank" rel="noopener noreferrer">
              Achavi
            </DropdownItem>
            <DropdownItem href={urls.osmRevert} target="_blank" rel="noopener noreferrer">
              osm-revert
            </DropdownItem>
            <DropdownItem href={urls.resultMaps} target="_blank" rel="noopener noreferrer">
              ResultMaps
            </DropdownItem>
          </DropdownSection>
          <DropdownDivider />
          <DropdownSection>
            <DropdownHeading>Editor</DropdownHeading>
            <DropdownItem href={urls.id} target="_blank" rel="noopener noreferrer">
              iD
            </DropdownItem>
            <DropdownItem href={urls.josm} target="_blank" rel="noopener noreferrer">
              JOSM
            </DropdownItem>
            <DropdownItem href={urls.level0} target="_blank" rel="noopener noreferrer">
              Level0
            </DropdownItem>
            <DropdownItem href={urls.rapid} target="_blank" rel="noopener noreferrer">
              Rapid
            </DropdownItem>
          </DropdownSection>
        </DropdownMenu>
      </Dropdown>

      <Dropdown>
        <DropdownButton
          outline
          className="flex min-h-11 w-full cursor-pointer items-center justify-between p-0 touch-manipulation select-none"
        >
          <div className="flex w-full items-center justify-between text-xs text-zinc-500">
            <p>
              {osmUser}
              {isInTrustedlist && (
                <StarIcon className="ml-1 inline-block size-4 align-text-bottom text-yellow-500" />
              )}
              {isInWatchlist && (
                <ExclamationTriangleIcon className="ml-1 inline-block size-4 align-text-bottom text-red-500" />
              )}
              {accountCreated ? (
                <>
                  {' '}
                  created <RelativeTime datetime={accountCreated} />
                </>
              ) : null}
              {editCount > 0 ? ` | ${editCount.toLocaleString()} edits` : null}
            </p>
            <div title="Changesets of this user marked good or bad in OSMCha">
              <Badge rounded="left">
                {checkedGood.toLocaleString()}{' '}
                <HandThumbUpIcon className="inline size-4 text-zinc-600" aria-label="Good changesets" />
              </Badge>
              <Badge rounded="right">
                <span className={clsx(checkedBad ? 'text-orange-700' : '')}>
                  {checkedBad.toLocaleString()}{' '}
                </span>
                <HandThumbDownIcon
                  className={clsx('inline size-4', checkedBad ? 'text-orange-500' : 'text-zinc-600')}
                  aria-label="Harmful changesets"
                />
              </Badge>
            </div>
          </div>
          <ChevronDownIcon data-slot="icon" />
        </DropdownButton>
        <DropdownMenu anchor="bottom start">
          <DropdownSection>
            <DropdownHeading>User {osmUser}</DropdownHeading>
            <DropdownItem
              href={`https://www.openstreetmap.org/user/${encodeURIComponent(osmUser)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              OSM profile
            </DropdownItem>
            <DropdownItem href={hdycUrl(osmUser)} target="_blank" rel="noopener noreferrer">
              HDYC
            </DropdownItem>
          </DropdownSection>
        </DropdownMenu>
      </Dropdown>

      <details
        className="rounded-lg"
        open={userOpen}
        onToggle={(event) => {
          onUserOpenChange?.((event.currentTarget as HTMLDetailsElement).open)
        }}
      >
        <summary
          className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg px-1 text-sm/5 font-medium text-zinc-700 touch-manipulation select-none marker:content-none [&::-webkit-details-marker]:hidden active:bg-zinc-950/5"
          title="User details (3)"
        >
          <span>User details</span>
          <span className="text-xs font-normal text-zinc-400">3</span>
        </summary>
        <User
          userDetails={{
            ...userDetails,
            uid: properties.uid ?? userDetails?.uid,
            name: osmUser,
          }}
          whosThat={whosThat}
          changesetUsername
        />
      </details>

      <div className="mt-2 flex flex-col gap-1 text-base">
        <p className="w-full leading-tight break-words hyphens-auto" lang="en">
          <strong className="font-semibold">{osmUser}:</strong>{' '}
          <Linkify
            options={{
              target: '_blank',
              rel: 'noopener noreferrer',
              className: 'text-blue-700 underline',
            }}
          >
            {properties.comment || 'NO COMMENT'}
          </Linkify>
        </p>
        {reasons.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {reasons.map((reason) => (
              <Badge key={reason.id ?? reason.name}>{reason.name}</Badge>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 pb-[env(safe-area-inset-bottom)] min-[56rem]:pb-1">
        {checked ? (
          <>
            <Badge color={resolved ? 'green' : harmful ? 'orange' : 'green'}>
              {harmful ? (
                <HandThumbDownIcon className="size-4" />
              ) : (
                <HandThumbUpIcon className="size-4" />
              )}{' '}
              by {properties.check_user || <i>Unknown user</i>}
            </Badge>
            <Button
              plain
              aria-label="Unreview changeset"
              onClick={() => handleMarkHarmful(-1)}
              className="min-h-11 min-w-11 cursor-pointer touch-manipulation select-none"
            >
              <XMarkIcon data-slot="icon" className="size-4" />
            </Button>
            {tags.map((tag) => (
              <Badge key={tag.id ?? tag.name} color={tag.id === RESOLVED_TAG_ID ? 'green' : undefined}>
                {tag.name}
              </Badge>
            ))}
            <Tags changesetId={changesetId} currentChangeset={currentChangeset} disabled={false} />
          </>
        ) : (
          <>
            <Button
              outline
              aria-label="Mark changeset as good"
              onClick={() => handleMarkHarmful(false)}
              className="min-h-11 min-w-11 cursor-pointer touch-manipulation select-none"
            >
              <HandThumbUpIcon
                data-slot="icon"
                className="size-4 text-zinc-600 active:text-green-500"
              />
            </Button>
            <Button
              outline
              aria-label="Mark changeset as harmful"
              onClick={() => handleMarkHarmful(true)}
              className="min-h-11 min-w-11 cursor-pointer touch-manipulation select-none"
            >
              <HandThumbDownIcon
                data-slot="icon"
                className="size-4 text-zinc-600 active:text-orange-500"
              />
            </Button>
          </>
        )}
      </div>

      <Divider className="mt-1" />
    </header>
  )
}
