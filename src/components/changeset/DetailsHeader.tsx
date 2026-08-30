import { useHotkeys } from '@tanstack/react-hotkeys'
import { getRouteApi } from '@tanstack/react-router'
import clsx from 'clsx'
import { useLayoutEffect, useRef, useState } from 'react'
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
import { formatAccountAge, formatLocalDateTime, parseOsmDate } from '../../utils/datetime.ts'
import { formatCompactCount } from '../../utils/formatCount.ts'
import { editorShortname } from '../list/editorShortname.ts'
import { ReviewVerdictIcon } from '../list/ReviewStatusBadge.tsx'
import { RelativeTime } from '../relative_time.tsx'
import { LinkifyText } from '../text/LinkifyText.tsx'
import { Alert, AlertActions, AlertDescription, AlertTitle } from '../ui/alert.tsx'
import { Badge, BadgeButton } from '../ui/badge.tsx'
import { Button } from '../ui/button.tsx'
import { Divider } from '../ui/divider.tsx'
import {
  Dropdown,
  DropdownButton,
  DropdownDescription,
  DropdownDivider,
  DropdownHeading,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
  DropdownSection,
} from '../ui/dropdown.tsx'
import {
  ChevronDownIcon,
  CircleCheckIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  QuoteIcon,
  StarIcon,
  XMarkIcon,
} from '../ui/icons.ts'
import { Tooltip } from '../ui/tooltip.tsx'
import { typeScale } from '../ui/typography.ts'
import { changesetTagsForDisplay } from './changesetTags.ts'
import { isOsmChangesetOpen } from './isOsmChangesetOpen.ts'
import { hdycUrl, missingMapsUrl, openExternal, openInUrls } from './openInUrls.ts'
import { type NamedTag, REVIEW_TAG_META, reviewPresentation } from './reviewPresentation.ts'
import { Tags } from './tags.tsx'
import TranslateButton from './translate_button.tsx'

const changesetRouteApi = getRouteApi('/changesets/$id')
const rootRouteApi = getRouteApi('__root__')

/** Trigger chrome shared by the changeset and user header menus. */
const headerMenuButtonClassName = clsx(
  'h-full w-full cursor-pointer touch-manipulation px-2 py-1 text-left select-none',
  // Stack title + meta; Chevron sits on the title row only so the meta line is full-width.
  'flex! flex-col! items-stretch! justify-start! gap-x-0 gap-y-0',
)

const headerMenuTitleRowClassName = 'flex min-w-0 items-center justify-between gap-x-2'

/** Fixed height matches the review-count badges so both header meta rows align. */
const headerMenuMetaClassName = clsx(
  '-mt-0.5 flex h-6 flex-nowrap items-center gap-x-1 font-normal text-zinc-500',
  typeScale.small,
)

/** Compact review counters in the user meta line (override Button’s `data-slot=icon` sizing). */
const headerReviewCountBadgeClassName = 'gap-x-0.5 px-1 py-0 text-[0.625rem]/3 sm:text-[0.625rem]/3'
const headerReviewCountIconClassName = 'inline size-3! my-0!'

/** Full sidebar content width; cancel Headless’ default start/end nudge so the panel lines up. */
const reviewHeaderMenuClassName = clsx(
  'w-(--button-width) max-w-[calc(100vw-1.25rem)]',
  '[--anchor-offset:0px]! data-[anchor~=end]:[--anchor-offset:0px]! data-[anchor~=start]:[--anchor-offset:0px]!',
)

const changesetOpenMenuClassName = clsx(
  reviewHeaderMenuClassName,
  '@container/changeset-open origin-top-left',
)

const userOpenMenuClassName = clsx(
  reviewHeaderMenuClassName,
  '@container/user-open origin-top-right',
)

function useReviewHeaderMenuWidth() {
  const pairRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(function observeReviewHeaderPairWidth() {
    const pair = pairRef.current
    if (!pair) return

    function measurePairWidth() {
      const el = pairRef.current
      if (!el) return
      setWidth(el.getBoundingClientRect().width)
    }

    measurePairWidth()
    const observer = new ResizeObserver(measurePairWidth)
    observer.observe(pair)
    return function disconnectPairWidthObserver() {
      observer.disconnect()
    }
  }, [])

  return { pairRef, menuStyle: width > 0 ? { width } : undefined }
}

/** Items under a group heading: up to three equal columns once the menu is wide enough. */
const headerOpenItemsClassName = clsx(
  'col-span-full grid grid-cols-1',
  '@min-[20rem]/changeset-open:grid-cols-3',
  '@min-[20rem]/user-open:grid-cols-3',
)

/** Override DropdownItem’s `col-span-full` so items can sit in the item grid. */
const headerOpenItemClassName = 'col-span-1!'

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
  const username = user?.username
  const markHarmfulMutation = useMarkHarmful()
  const [leftoverAlertOpen, setLeftoverAlertOpen] = useState(false)
  const { pairRef, menuStyle } = useReviewHeaderMenuWidth()
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
  const presentation = reviewPresentation({
    checked,
    harmful,
    tags,
    checkUser: properties.check_user,
  })
  const reviewColor = presentation?.color ?? 'green'
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
  const comment = properties.comment?.trim() ?? ''
  const hasLeftoverTags = tags.length > 0

  function markLooksOk(clearTags: boolean) {
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
      harmful: false,
      username,
      ...(clearTags ? { tags: [] } : {}),
    })
    setLeftoverAlertOpen(false)
  }

  /** Looks OK — alert when leftover issue tags remain. Keep docs/review.md in sync. */
  function requestLooksOk() {
    if (!token) {
      toast.error('You must be logged in to mark changesets')
      return
    }
    if (!username) {
      toast.error('Username not available')
      return
    }
    if (hasLeftoverTags) {
      setLeftoverAlertOpen(true)
      return
    }
    markLooksOk(false)
  }

  function handleMarkHarmful(
    value: boolean | -1,
    options?: { tags?: number[]; tagObjects?: Array<{ id: number; name: string }> },
  ) {
    if (!token) {
      toast.error('You must be logged in to mark changesets')
      return
    }
    if (!username) {
      toast.error('Username not available')
      return
    }
    if (value === false) {
      requestLooksOk()
      return
    }
    markHarmfulMutation.mutate({
      changesetId,
      harmful: value,
      username,
      tags: options?.tags,
      tagObjects: options?.tagObjects,
    })
  }

  function markNeedsALook(tag?: { id: number; name: string }) {
    if (tag) {
      handleMarkHarmful(true, { tags: [tag.id], tagObjects: [tag] })
    } else {
      handleMarkHarmful(true)
    }
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
      callback: () => markNeedsALook(),
    })),
    ...VERIFY_CLEAR.hotkeys.map((hotkey) => ({
      hotkey,
      callback: () => handleMarkHarmful(-1),
    })),
    ...VERIFY_GOOD.hotkeys.map((hotkey) => ({
      hotkey,
      callback: () => requestLooksOk(),
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
      <div ref={pairRef} className="grid grid-cols-1 gap-2 @min-[28rem]/review:grid-cols-2">
        <Dropdown className="min-w-0">
          <DropdownButton outline className={headerMenuButtonClassName}>
            <span className={headerMenuTitleRowClassName}>
              <h1 className={clsx(typeScale.heading, 'min-w-0 flex-1 truncate')}>
                Changeset #{changesetId}
              </h1>
              <ChevronDownIcon data-slot="icon" className="size-4 shrink-0" />
            </span>
            <div className={headerMenuMetaClassName}>
              {changesetDate ? <RelativeTime datetime={changesetDate} /> : 'Unknown date'}
              {changesetIsOpen ? (
                <Tooltip
                  as="span"
                  content="This OSM changeset is still open. Further edits can still land; the map diff may be incomplete."
                >
                  <Badge color="amber">Open</Badge>
                </Tooltip>
              ) : null}
              {' | '}
              <Tooltip
                as="abbr"
                content={`Editor ${properties.editor ?? 'unknown'}${
                  properties.metadata?.host ? ` on ${properties.metadata.host}` : ''
                }`}
              >
                {editorLabel}
              </Tooltip>
            </div>
          </DropdownButton>
          <DropdownMenu
            anchor="bottom start"
            className={changesetOpenMenuClassName}
            style={menuStyle}
          >
            <DropdownSection>
              <DropdownHeading>Changeset #{changesetId}</DropdownHeading>
              <DropdownItem href={urls.osm} target="_blank" rel="noopener noreferrer">
                Changeset on OpenStreetMap.org
              </DropdownItem>
            </DropdownSection>
            <DropdownDivider />
            <DropdownSection>
              <DropdownHeading>Changeset tools</DropdownHeading>
              <div className={headerOpenItemsClassName}>
                <DropdownItem
                  href={urls.achavi}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={headerOpenItemClassName}
                >
                  Achavi
                </DropdownItem>
                <DropdownItem
                  href={urls.osmRevert}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={headerOpenItemClassName}
                >
                  osm-revert
                </DropdownItem>
                <DropdownItem
                  href={urls.resultMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={headerOpenItemClassName}
                >
                  ResultMaps
                </DropdownItem>
              </div>
            </DropdownSection>
            <DropdownDivider />
            <DropdownSection>
              <DropdownHeading>Open map location in editor</DropdownHeading>
              <div className={headerOpenItemsClassName}>
                <DropdownItem
                  href={urls.id}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={headerOpenItemClassName}
                >
                  iD
                </DropdownItem>
                <DropdownItem
                  href={urls.rapid}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={headerOpenItemClassName}
                >
                  Rapid
                </DropdownItem>
              </div>
            </DropdownSection>
            <DropdownDivider />
            <DropdownSection>
              <DropdownHeading>Open changeset in editor</DropdownHeading>
              <div className={headerOpenItemsClassName}>
                <DropdownItem
                  href={urls.josm}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={headerOpenItemClassName}
                >
                  JOSM
                </DropdownItem>
                <DropdownItem
                  href={urls.level0}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={headerOpenItemClassName}
                >
                  Level0
                </DropdownItem>
              </div>
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

        <Dropdown className="min-w-0">
          <DropdownButton outline className={headerMenuButtonClassName}>
            <span className={headerMenuTitleRowClassName}>
              <span className={clsx(typeScale.heading, 'min-w-0 flex-1 truncate')}>
                By {osmUser}
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
              </span>
              <ChevronDownIcon data-slot="icon" className="size-4 shrink-0" />
            </span>
            <div className={headerMenuMetaClassName}>
              {accountCreated ? (
                <Tooltip
                  as="span"
                  content={[
                    formatLocalDateTime(accountCreated),
                    formatAccountAge(accountCreated, new Date(), { full: true }),
                  ].join('\n')}
                >
                  <time dateTime={accountCreated.toISOString()}>
                    {formatAccountAge(accountCreated, new Date(), { compact: true })}
                  </time>
                </Tooltip>
              ) : null}
              {editCount > 0 ? (
                <>
                  {accountCreated ? ' | ' : null}
                  <Tooltip as="span" content={`${editCount.toLocaleString()} edits`}>
                    {formatCompactCount(editCount)}
                  </Tooltip>
                </>
              ) : null}
              <Tooltip
                as="span"
                content={[
                  'Changesets of this user marked in OSMCha:',
                  `${checkedGood.toLocaleString()} Looks OK`,
                  `${checkedBad.toLocaleString()} Needs a look`,
                ].join('\n')}
                className="isolate ml-auto inline-flex shrink-0 rounded-md"
              >
                <Badge rounded="left" className={headerReviewCountBadgeClassName}>
                  {checkedGood.toLocaleString()}{' '}
                  <CircleCheckIcon
                    variant="fill"
                    className={clsx(headerReviewCountIconClassName, 'text-zinc-600')}
                    aria-label="Looks OK changesets"
                  />
                </Badge>
                <Badge rounded="right" className={clsx('-ml-px', headerReviewCountBadgeClassName)}>
                  <span className={clsx(checkedBad ? 'text-orange-700' : '')}>
                    {checkedBad.toLocaleString()}{' '}
                  </span>
                  <FlagIcon
                    variant="fill"
                    className={clsx(
                      headerReviewCountIconClassName,
                      checkedBad ? 'text-orange-500' : 'text-zinc-600',
                    )}
                    aria-label="Needs a look changesets"
                  />
                </Badge>
              </Tooltip>
            </div>
          </DropdownButton>
          <DropdownMenu anchor="bottom end" className={userOpenMenuClassName} style={menuStyle}>
            <DropdownSection>
              <DropdownHeading>
                User {osmUser}
                {uid ? ` / ${uid}` : ''}
              </DropdownHeading>
              <div className={headerOpenItemsClassName}>
                <DropdownItem
                  href={`https://www.openstreetmap.org/user/${encodeURIComponent(osmUser)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={headerOpenItemClassName}
                >
                  OSM profile
                </DropdownItem>
                <DropdownItem
                  href={hdycUrl(osmUser)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={headerOpenItemClassName}
                >
                  HDYC
                </DropdownItem>
                {properties.user || userDetails?.name ? (
                  <DropdownItem
                    href={missingMapsUrl(osmUser)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={headerOpenItemClassName}
                  >
                    Missing Maps
                  </DropdownItem>
                ) : null}
              </div>
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
                    <div className={headerOpenItemsClassName}>
                      <DropdownItem
                        onClick={() =>
                          addToWatchlistMutation.mutate({ username: osmUser, uid: String(uid) })
                        }
                        className={headerOpenItemClassName}
                      >
                        Add to watchlist
                      </DropdownItem>
                      <DropdownItem
                        onClick={() => addToTrustedlistMutation.mutate(osmUser)}
                        className={headerOpenItemClassName}
                      >
                        Add to trusted users
                      </DropdownItem>
                    </div>
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
        <blockquote
          className="relative flex w-full items-start gap-1 leading-tight wrap-break-word hyphens-auto not-italic"
          lang="en"
        >
          <QuoteIcon className="mt-0.5 size-3.5 shrink-0 text-zinc-400" aria-hidden />
          <p className={clsx('min-w-0 flex-1', comment && 'pr-4')}>
            <span className="sr-only">Changeset comment: </span>
            <LinkifyText text={comment || 'NO COMMENT'} />
          </p>
          {comment ? <TranslateButton text={comment} /> : null}
        </blockquote>
        {reasons.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {reasons.map((reason) => (
              <Badge key={reason.id ?? reason.name}>{reason.name}</Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {checked && presentation ? (
          <>
            <div
              className={clsx(
                'isolate inline-flex h-8 max-w-full min-w-0 flex-none items-stretch whitespace-nowrap',
                'divide-x divide-black/10 overflow-hidden rounded-md ring-1 ring-black/10',
              )}
            >
              <Tooltip as="span" content={presentation.tooltip} className="h-full">
                <Badge
                  color={reviewColor}
                  rounded="none"
                  className="h-full rounded-none"
                  aria-label={presentation.tooltip}
                >
                  <ReviewVerdictIcon kind={presentation.icon} /> by{' '}
                  {properties.check_user || <i>Unknown user</i>}
                </Badge>
              </Tooltip>
              <BadgeButton
                color={reviewColor}
                rounded="none"
                aria-label="Unreview changeset"
                onClick={() => handleMarkHarmful(-1)}
                className="h-full min-h-0 min-w-7 cursor-pointer touch-manipulation items-stretch justify-center rounded-none select-none"
              >
                <XMarkIcon className="size-3.5" />
              </BadgeButton>
              {harmful === true ? (
                <Tags
                  changesetId={changesetId}
                  currentChangeset={currentChangeset}
                  disabled={false}
                  color={reviewColor}
                  allowAdd
                />
              ) : null}
            </div>
            {harmful === false && hasLeftoverTags ? (
              <div
                className={clsx(
                  'isolate inline-flex h-8 max-w-full min-w-0 flex-none items-stretch whitespace-nowrap',
                  'divide-x divide-black/10 overflow-hidden rounded-md ring-1 ring-black/10',
                )}
                aria-label="Leftover review tags"
              >
                <Tags
                  changesetId={changesetId}
                  currentChangeset={currentChangeset}
                  disabled={false}
                  color="zinc"
                  allowAdd={false}
                  leftover
                />
              </div>
            ) : null}
          </>
        ) : (
          <>
            <Button
              outline
              aria-label="Nothing stood out; I think this is OK"
              onClick={() => requestLooksOk()}
              className="min-h-11 cursor-pointer touch-manipulation select-none"
            >
              <CircleCheckIcon
                data-slot="icon"
                className="size-4 text-zinc-600 active:text-green-500"
              />
              Looks OK
            </Button>
            <Dropdown>
              <DropdownButton
                outline
                aria-label="Something here is worth checking or discussing"
                className="min-h-11 cursor-pointer touch-manipulation select-none"
              >
                <FlagIcon
                  data-slot="icon"
                  className="size-4 text-zinc-600 active:text-orange-500"
                />
                Needs a look
                <ChevronDownIcon data-slot="icon" className="size-4" />
              </DropdownButton>
              <DropdownMenu anchor="bottom start">
                <DropdownItem onClick={() => markNeedsALook()}>
                  <FlagIcon data-slot="icon" />
                  <DropdownLabel>Needs a look</DropdownLabel>
                  <DropdownDescription>
                    Something here is worth checking or discussing.
                  </DropdownDescription>
                </DropdownItem>
                <DropdownDivider />
                <DropdownSection>
                  <DropdownHeading>Intent</DropdownHeading>
                  {REVIEW_TAG_META.filter((tag) => tag.group === 'intent').map((tag) => (
                    <DropdownItem
                      key={tag.id}
                      onClick={() => markNeedsALook({ id: tag.id, name: tag.name })}
                    >
                      <ReviewVerdictIcon kind={tag.icon} variant="outline" />
                      <DropdownLabel>{tag.name}</DropdownLabel>
                      <DropdownDescription>{tag.tooltip}</DropdownDescription>
                    </DropdownItem>
                  ))}
                </DropdownSection>
                <DropdownDivider />
                <DropdownSection>
                  <DropdownHeading>Severity</DropdownHeading>
                  {REVIEW_TAG_META.filter((tag) => tag.group === 'severity').map((tag) => (
                    <DropdownItem
                      key={tag.id}
                      onClick={() => markNeedsALook({ id: tag.id, name: tag.name })}
                    >
                      <ReviewVerdictIcon kind={tag.icon} variant="outline" />
                      <DropdownLabel>{tag.name}</DropdownLabel>
                      <DropdownDescription>{tag.tooltip}</DropdownDescription>
                    </DropdownItem>
                  ))}
                </DropdownSection>
                <DropdownDivider />
                <DropdownSection>
                  <DropdownHeading>Follow-up</DropdownHeading>
                  {REVIEW_TAG_META.filter((tag) => tag.group === 'followUp').map((tag) => (
                    <DropdownItem
                      key={tag.id}
                      onClick={() => markNeedsALook({ id: tag.id, name: tag.name })}
                    >
                      <ReviewVerdictIcon kind={tag.icon} variant="outline" />
                      <DropdownLabel>{tag.name}</DropdownLabel>
                      <DropdownDescription>{tag.tooltip}</DropdownDescription>
                    </DropdownItem>
                  ))}
                </DropdownSection>
                <DropdownDivider />
                <DropdownSection>
                  <DropdownHeading>Escalation</DropdownHeading>
                  {REVIEW_TAG_META.filter((tag) => tag.group === 'escalation').map((tag) => (
                    <DropdownItem
                      key={tag.id}
                      onClick={() => markNeedsALook({ id: tag.id, name: tag.name })}
                    >
                      <ReviewVerdictIcon kind={tag.icon} variant="outline" />
                      <DropdownLabel>{tag.name}</DropdownLabel>
                      <DropdownDescription>{tag.tooltip}</DropdownDescription>
                    </DropdownItem>
                  ))}
                </DropdownSection>
              </DropdownMenu>
            </Dropdown>
          </>
        )}
      </div>

      <Alert open={leftoverAlertOpen} onClose={() => setLeftoverAlertOpen(false)} size="md">
        <AlertTitle>Remove leftover tags?</AlertTitle>
        <AlertDescription>
          These tags describe issues and do not belong with Looks OK:{' '}
          {tags.map((tag) => tag.name).join(', ') || 'none'}.
        </AlertDescription>
        <AlertActions>
          <Button plain onClick={() => setLeftoverAlertOpen(false)}>
            Cancel
          </Button>
          <Button outline onClick={() => markLooksOk(false)}>
            Keep tags
          </Button>
          <Button onClick={() => markLooksOk(true)}>Remove tags and mark Looks OK</Button>
        </AlertActions>
      </Alert>

      <Divider className="mt-1" />
    </header>
  )
}
