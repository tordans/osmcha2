import { useHotkeys } from '@tanstack/react-hotkeys'
import { getRouteApi } from '@tanstack/react-router'
import clsx from 'clsx'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
import { useChangesetDiscussion } from '../../query/hooks/useChangesetDiscussion.ts'
import { useMarkHarmful } from '../../query/hooks/useMarkHarmful.ts'
import {
  useAddToTrustedlist,
  useRemoveFromTrustedlist,
} from '../../query/hooks/useTrustedlistMutations.ts'
import {
  useAddToWatchlist,
  useRemoveFromWatchlist,
} from '../../query/hooks/useWatchlistMutations.ts'
import { listSearchFromFilters } from '../../routing/filterSearch.ts'
import { parseMapParam } from '../../routing/mapParam.ts'
import { parseOsmDate } from '../../utils/datetime.ts'
import { editorShortname } from '../list/editorShortname.ts'
import { RelativeTime } from '../relative_time.tsx'
import { LinkifyText } from '../text/LinkifyText.tsx'
import { Badge, BadgeButton } from '../ui/badge.tsx'
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
import {
  ChevronDownIcon,
  ExclamationTriangleIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
  StarIcon,
  XMarkIcon,
} from '../ui/icons.ts'
import { typeScale } from '../ui/typography.ts'
import { changesetTagsForDisplay } from './changesetTags.ts'
import { isOsmChangesetOpen } from './isOsmChangesetOpen.ts'
import { hdycUrl, missingMapsUrl, openExternal, openInUrls } from './openInUrls.ts'
import { Tags } from './tags.tsx'

const changesetRouteApi = getRouteApi('/changesets/$id')
const rootRouteApi = getRouteApi('__root__')

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
    metadata?: Record<string, string | number>
  }
}

function hasResolvedTag(tags: NamedTag[]) {
  return tags.some((tag) => tag.id === RESOLVED_TAG_ID)
}

type DetailsHeaderProps = {
  changesetId: number
  currentChangeset: ReviewChangeset
  userDetails?: ReviewUserDetails | null
  whosThat?: string[]
}

export function DetailsHeader({
  changesetId,
  currentChangeset,
  userDetails,
  whosThat = [],
}: DetailsHeaderProps) {
  const { map } = changesetRouteApi.useSearch()
  const navigate = rootRouteApi.useNavigate()
  const { token, user } = useAuth()
  const { data: osmMetadata } = useChangesetDiscussion(changesetId)
  const changesetIsOpen = isOsmChangesetOpen(osmMetadata)
  const username = (user as { username?: string } | undefined)?.username
  const markHarmfulMutation = useMarkHarmful()
  const properties = currentChangeset.properties ?? {}
  const osmUser = properties.user ?? userDetails?.name ?? 'OSM User'
  const uid = Number(properties.uid ?? userDetails?.uid) || 0
  const [isInTrustedlist, isInWatchlist] = useIsUserListed(osmUser, uid, token)
  const addToWatchlistMutation = useAddToWatchlist()
  const removeFromWatchlistMutation = useRemoveFromWatchlist()
  const addToTrustedlistMutation = useAddToTrustedlist()
  const removeFromTrustedlistMutation = useRemoveFromTrustedlist()
  const urls = openInUrls(changesetId, parseMapParam(map ?? ''))
  const tags = properties.tags ?? []
  const reasons = properties.reasons ?? []
  const checked = Boolean(properties.checked)
  const harmful = properties.harmful
  const resolved = hasResolvedTag(tags)
  const reviewColor = resolved ? 'green' : harmful ? 'orange' : 'green'
  const editorLabel = editorShortname(properties.editor)
  const changesetDate = properties.date ? parseOsmDate(properties.date) : null
  const accountCreated = userDetails?.accountCreated
    ? parseOsmDate(userDetails.accountCreated)
    : null
  const editCount = userDetails?.count ?? 0
  const checkedGood = Math.max(
    0,
    (userDetails?.checked_changesets ?? 0) - (userDetails?.harmful_changesets ?? 0),
  )
  const checkedBad = userDetails?.harmful_changesets ?? 0
  const visibleMetadata = changesetTagsForDisplay(properties.metadata)
  const pastNames = whosThat.length > 1 ? whosThat.slice(0, -1) : []
  const description = userDetails?.description?.trim() ?? ''

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

  function filterOsmchaByUser() {
    if (!uid) return
    void navigate({
      to: '/',
      search: listSearchFromFilters({
        uids: [{ label: String(uid), value: String(uid) }],
        date__gte: [{ label: '', value: '' }],
      }),
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
    <header className="flex flex-col gap-2.5 bg-zinc-50 p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] min-[56rem]:pb-2.5">
      <div className="flex flex-col gap-2">
        <Dropdown>
          <DropdownButton
            outline
            className="w-full cursor-pointer touch-manipulation justify-between! px-2 py-1 text-left select-none"
          >
            <span className="min-w-0 flex-1 text-left">
              <h1 className={typeScale.heading}>Changeset #{changesetId}</h1>
              <div
                className={clsx(
                  '-mt-0.5 flex flex-wrap items-center gap-x-1 font-normal text-zinc-500',
                  typeScale.small,
                )}
              >
                {changesetDate ? <RelativeTime datetime={changesetDate} /> : 'Unknown date'}
                {changesetIsOpen ? (
                  <Badge
                    color="amber"
                    title="This OSM changeset is still open. Further edits can still land; the map diff may be incomplete."
                  >
                    Open
                  </Badge>
                ) : null}
                {' | '}
                <abbr
                  title={`Editor ${properties.editor ?? 'unknown'}${
                    properties.metadata?.host ? ` on ${properties.metadata.host}` : ''
                  }`}
                >
                  {editorLabel}
                </abbr>
              </div>
            </span>
            <ChevronDownIcon data-slot="icon" className="size-4 shrink-0" />
          </DropdownButton>
          <DropdownMenu
            anchor="bottom start"
            className="w-(--button-width) max-w-[min(24rem,calc(100vw-1.5rem))]"
          >
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
            {visibleMetadata.length > 0 ? (
              <>
                <DropdownDivider />
                <DropdownSection>
                  <DropdownHeading>Changeset tags</DropdownHeading>
                  <table
                    className={clsx(
                      'col-span-full mx-2 mb-1 w-[calc(100%-1rem)] table-fixed',
                      'text-[0.6875rem]/4 wrap-break-word text-zinc-600',
                    )}
                  >
                    <tbody>
                      {visibleMetadata.map(([key, val]) => (
                        <tr key={key} className="align-top">
                          <th className="w-[38%] pr-2 pb-0.5 text-left font-medium text-zinc-500">
                            {key}
                          </th>
                          <td className="pb-0.5 break-all">{String(val)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DropdownSection>
              </>
            ) : null}
          </DropdownMenu>
        </Dropdown>

        <Dropdown>
          <DropdownButton
            outline
            className="w-full cursor-pointer touch-manipulation justify-between! px-2 py-1 text-left select-none"
          >
            <span
              className={clsx(
                'min-w-0 flex-1 text-left font-normal text-zinc-500',
                typeScale.small,
              )}
            >
              {osmUser}
              {isInTrustedlist && (
                <StarIcon
                  variant="fill"
                  className="ml-1 inline-block size-4 align-text-bottom text-yellow-500"
                />
              )}
              {isInWatchlist && (
                <ExclamationTriangleIcon
                  variant="fill"
                  className="ml-1 inline-block size-4 align-text-bottom text-red-500"
                />
              )}
              {accountCreated ? (
                <>
                  {' '}
                  created <RelativeTime datetime={accountCreated} />
                </>
              ) : null}
              {editCount > 0 ? ` | ${editCount.toLocaleString()} edits` : null}
            </span>
            <span
              className="isolate inline-flex shrink-0 rounded-md"
              title="Changesets of this user marked good or bad in OSMCha"
            >
              <Badge rounded="left">
                {checkedGood.toLocaleString()}{' '}
                <HandThumbUpIcon
                  variant="fill"
                  className="inline size-4 text-zinc-600"
                  aria-label="Good changesets"
                />
              </Badge>
              <Badge rounded="right" className="-ml-px">
                <span className={clsx(checkedBad ? 'text-orange-700' : '')}>
                  {checkedBad.toLocaleString()}{' '}
                </span>
                <HandThumbDownIcon
                  variant="fill"
                  className={clsx(
                    'inline size-4',
                    checkedBad ? 'text-orange-500' : 'text-zinc-600',
                  )}
                  aria-label="Harmful changesets"
                />
              </Badge>
            </span>
            <ChevronDownIcon data-slot="icon" className="size-4 shrink-0" />
          </DropdownButton>
          <DropdownMenu
            anchor="bottom start"
            className="w-(--button-width) max-w-[min(24rem,calc(100vw-1.5rem))]"
          >
            <DropdownSection>
              <DropdownHeading>
                User {osmUser}
                {uid ? ` / ${uid}` : ''}
              </DropdownHeading>
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
              {properties.user || userDetails?.name ? (
                <DropdownItem
                  href={missingMapsUrl(osmUser)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Missing Maps
                </DropdownItem>
              ) : null}
            </DropdownSection>
            {uid ? (
              <>
                <DropdownDivider />
                <DropdownSection>
                  <DropdownHeading>OSMCha</DropdownHeading>
                  <DropdownItem onClick={filterOsmchaByUser}>
                    {editCount > 0
                      ? `${editCount.toLocaleString()} changesets by this user`
                      : 'Changesets by this user'}
                  </DropdownItem>
                </DropdownSection>
              </>
            ) : null}
            {token && uid ? (
              <>
                <DropdownDivider />
                <DropdownSection>
                  <DropdownHeading>Lists</DropdownHeading>
                  {isInWatchlist ? (
                    <DropdownItem onClick={() => removeFromWatchlistMutation.mutate(String(uid))}>
                      Remove from watchlist
                    </DropdownItem>
                  ) : isInTrustedlist ? (
                    <DropdownItem onClick={() => removeFromTrustedlistMutation.mutate(osmUser)}>
                      Remove from trusted users
                    </DropdownItem>
                  ) : (
                    <>
                      <DropdownItem
                        onClick={() =>
                          addToWatchlistMutation.mutate({ username: osmUser, uid: String(uid) })
                        }
                      >
                        Add to watchlist
                      </DropdownItem>
                      <DropdownItem onClick={() => addToTrustedlistMutation.mutate(osmUser)}>
                        Add to trusted users
                      </DropdownItem>
                    </>
                  )}
                </DropdownSection>
              </>
            ) : null}
            {pastNames.length > 0 || description ? (
              <>
                <DropdownDivider />
                {pastNames.length > 0 ? (
                  <DropdownSection>
                    <DropdownHeading>Past usernames</DropdownHeading>
                    <ul className="col-span-full list-disc px-3.5 pb-1 pl-7 text-xs/4 text-zinc-600 sm:px-3">
                      {pastNames.map((name) => (
                        <li key={name}>{name}</li>
                      ))}
                    </ul>
                  </DropdownSection>
                ) : null}
                {description ? (
                  <blockquote
                    className={clsx(
                      'col-span-full mx-2 mb-1 border-l-2 border-zinc-200 py-0.5 pl-2.5',
                      'text-[0.6875rem]/4 wrap-break-word text-zinc-600',
                      '[&_a]:text-blue-700 [&_a]:underline',
                      '[&_p]:my-1 [&_p]:first:mt-0 [&_p]:last:mb-0',
                      '[&_h1]:my-1 [&_h1]:text-xs/4 [&_h1]:font-semibold',
                      '[&_h2]:my-1 [&_h2]:text-xs/4 [&_h2]:font-semibold',
                      '[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-4',
                      '[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-4',
                    )}
                  >
                    <Markdown remarkPlugins={[remarkGfm]}>{description}</Markdown>
                  </blockquote>
                ) : null}
              </>
            ) : null}
          </DropdownMenu>
        </Dropdown>
      </div>

      <div className={clsx('flex flex-col gap-1', typeScale.body)}>
        <p className="w-full leading-tight break-words hyphens-auto" lang="en">
          <strong className="font-semibold">{osmUser}:</strong>{' '}
          <LinkifyText text={properties.comment || 'NO COMMENT'} />
        </p>
        {reasons.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {reasons.map((reason) => (
              <Badge key={reason.id ?? reason.name}>{reason.name}</Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {checked ? (
          <div
            className={clsx(
              'isolate inline-flex h-8 max-w-full min-w-0 flex-none items-stretch whitespace-nowrap',
              'divide-x divide-black/10 overflow-hidden rounded-md ring-1 ring-black/10',
            )}
          >
            <Badge color={reviewColor} rounded="none" className="h-full rounded-none">
              {harmful ? (
                <HandThumbDownIcon variant="fill" className="size-4" />
              ) : (
                <HandThumbUpIcon variant="fill" className="size-4" />
              )}{' '}
              by {properties.check_user || <i>Unknown user</i>}
            </Badge>
            <BadgeButton
              color={reviewColor}
              rounded="none"
              aria-label="Unreview changeset"
              onClick={() => handleMarkHarmful(-1)}
              className="h-full min-w-7 cursor-pointer touch-manipulation items-center justify-center rounded-none select-none"
            >
              <XMarkIcon className="size-3.5" />
            </BadgeButton>
            {tags.map((tag) => (
              <Badge
                key={tag.id ?? tag.name}
                color={reviewColor}
                rounded="none"
                className="h-full rounded-none"
              >
                {tag.name}
              </Badge>
            ))}
            <Tags
              changesetId={changesetId}
              currentChangeset={currentChangeset}
              disabled={false}
              color={reviewColor}
            />
          </div>
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
