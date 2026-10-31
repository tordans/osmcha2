import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { Fragment, memo, use, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { collectGroupThreads, withoutGroupNotes } from '../../notes/groupNotes.ts'
import {
  flattenObjectNotes,
  locateNotes,
  objectRefKey,
  type LocatedNotes,
  type ObjectNotes,
} from '../../notes/locateNotes.ts'
import {
  effectiveSeenAt,
  isObjectSeenCollapsed,
  latestForeignNoteAt,
  type DraftNote,
} from '../../notes/reviewSeen.ts'
import { useNotesUserKey } from '../../notes/useNotesUserKey.ts'
import { useChangesetDiscussion } from '../../query/hooks/useChangesetDiscussion.ts'
import type { RefParam } from '../../routing/refParam.ts'
import {
  useChangesetHoverActions,
  useIsAnyElementHovered,
  useIsElementHovered,
  useIsListScrollTarget,
} from '../../stores/changeset-hover-store.ts'
import {
  getSeenState,
  useChangesetNotesActions,
  useDraftsForObjects,
  useIsUnseenOverride,
  useObjectDrafts,
  useObjectSeenAt,
  useOpenEditorNoteId,
  useSeenMap,
  useUnseenOverrides,
} from '../../stores/changeset-notes-store.ts'
import { useIsGroupCursor, useReviewFocusActions } from '../../stores/review-focus-store.ts'
import type { NonEmptyArray } from '../../utils/nonEmptyArray.ts'
import type { ActiveWorkArea, WorkArea } from '../../views/changesetWorkAreas.ts'
import { Loading } from '../loading.tsx'
import { TagRows } from '../tag_rows.tsx'
import { Badge } from '../ui/badge.tsx'
import { ChevronRightIcon, ExclamationTriangleIcon, MapPinIcon } from '../ui/icons.ts'
import { Tooltip } from '../ui/tooltip.tsx'
import { typeScale } from '../ui/typography.ts'
import { ACTION, ACTION_UI_COLOR } from './actionColors.ts'
import { ActionIcon, ActionTypeLabel } from './ActionTypeLabel.tsx'
import { MarkSeenButton, ObjectReviewActions } from './AddNoteButton.tsx'
import {
  buildElementChanges,
  mergeFlaggedFeatures,
  tagMutationRows,
  tagRowKeys,
  type AdiffAction,
  type ElementChange,
  type FlaggedFeature,
  type NamedReason,
  type NodeStats,
} from './changesetElements.ts'
import { DropdownOpenElement } from './DropdownOpenElement.tsx'
import { presetContextOf } from './elementPresets.ts'
import { FinishReviewCard, UnsentNotesBar } from './FinishReviewCard.tsx'
import { formatMoveMeters, MINOR_MOVES_EXPLANATION } from './minorMoves.ts'
import { NoteEditor } from './NoteEditor.tsx'
import {
  ChangesetNotesSection,
  ChangesNotesHeader,
  GroupNotesBlock,
  NotesBlock,
  OtherNotesSection,
} from './NotesBlock.tsx'
import {
  flashNoteThreadElement,
  groupThreadDomId,
  NOTE_THREAD_FLASH_MS,
  noteThreadDomId,
} from './noteThreadDom.ts'
import {
  estimatedChangeRowPx,
  estimatedGroupPx,
  OFFSCREEN_ROW_CLASSNAME,
  offscreenRowStyle,
} from './offscreenRows.ts'
import { refParamFromElement, tagGroupContainsRef } from './refSelection.ts'
import {
  changeRowDomId,
  groupHeaderTarget,
  workAreaSectionDomId,
} from './scrollChildIntoScroller.ts'
import { TAG_GROUP_CODE_STYLE, TAG_GROUP_EDGE, TAG_GROUP_FILL } from './tagGroupColor.ts'
import { changeKey, tagGroupsOf, type ChangeListItem, type TagGroups } from './tagGroups.ts'
import { PresetContextValue, usePresetLine, useSharedPresetLine } from './usePresetLine.ts'
import { MoveOnAfterSeenContext, useReviewCursorKeys } from './useReviewCursorKeys.ts'

const disclosureTransition = { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const }
const DEEP_LINK_FLASH_MS = 2000
const NO_FLAGGED: NonNullable<DetailsChangesProps['features']> = []
const NO_REVIEWED: NonNullable<DetailsChangesProps['reviewedFeatures']> = []
const NO_REASONS: NonNullable<DetailsChangesProps['reasons']> = []
const NO_WORK_AREAS: WorkArea[] = []
const TAG_GROUP_EXPLANATION = 'Same tag changes: all of these objects got the same edit.'
/** List items (rows or groups) in the first render: more than two phone screens. */
const FIRST_RENDER_LIST_ITEMS = 20
/** Pause before a fully seen group folds away, so the rows show their new state first. */
const SEEN_FOLD_DELAY_S = 0.4

type ReviewedFeature = { id?: string; user?: string }

type DetailsChangesProps = {
  changesetId: number
  adiff?: { actions?: AdiffAction[] } | null
  workAreas?: WorkArea[]
  activeWorkArea?: ActiveWorkArea
  jumpToWorkArea?: (area: WorkArea | null) => void
  features?: FlaggedFeature[]
  reviewedFeatures?: ReviewedFeature[]
  reasons?: NamedReason[]
  selected?: AdiffAction | null
  selectedRef?: RefParam | null
  selectRef: (ref: RefParam | null) => void
  deepLinkReveal?: RefParam | null
  deepLinkEpoch?: number
  zoomToAndSelect: (type: string, id: number, key?: string) => void
  zoomToGroup: (members: readonly ElementChange[]) => void
  clearSelection: () => void
}

function listedObjectsFromChanges(changes: ElementChange[]) {
  const listedObjects = new Set<string>()
  const keysByObject = new Map<string, Set<string>>()
  for (const change of changes) {
    const key = objectRefKey(change.type, change.id)
    listedObjects.add(key)
    keysByObject.set(key, new Set(change.tags.flatMap(tagRowKeys)))
  }
  return { listedObjects, keysByObject }
}

function countLocatedNotes(located: LocatedNotes): number {
  let total = located.changesetNotes.length + located.unmatched.length
  for (const objectNotes of located.byObject.values()) {
    total += objectNotes.object.length
    for (const notes of objectNotes.byKey.values()) total += notes.length
  }
  return total
}

function noteCountByKey(notes?: ObjectNotes): Record<string, number> {
  if (!notes) return {}
  const counts: Record<string, number> = {}
  for (const [key, list] of notes.byKey) {
    if (list.length > 0) counts[key] = list.length
  }
  return counts
}

function aggregateNoteCountByKey(
  changes: ElementChange[],
  notesByObject: Map<string, ObjectNotes>,
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const change of changes) {
    for (const [key, count] of Object.entries(
      noteCountByKey(notesByObject.get(objectRefKey(change.type, change.id))),
    )) {
      counts[key] = (counts[key] ?? 0) + count
    }
  }
  return counts
}

type SeenState = {
  seenMap: Record<string, string> | undefined
  unseenOverrides: readonly string[] | undefined
}

type ObjectSeen = { seenAt: string | undefined; unseenOverride: boolean }

function objectSeenOf({ seenMap, unseenOverrides }: SeenState, objectKey: string): ObjectSeen {
  return {
    seenAt: seenMap?.[objectKey],
    unseenOverride: unseenOverrides?.includes(objectKey) ?? false,
  }
}

function objectKeysOf(changes: readonly ElementChange[]): ReadonlySet<string> {
  return new Set(changes.map((change) => objectRefKey(change.type, change.id)))
}

/** Drafts on one object out of a list of drafts. */
function draftsOn(notes: readonly DraftNote[], type: string, id: number) {
  return notes.filter((note) => note.ref?.type === type && note.ref.id === id)
}

function reviewState(
  change: ElementChange,
  { seenAt, unseenOverride }: ObjectSeen,
  objectNotes: ObjectNotes | undefined,
  drafts: DraftNote[],
  currentUser?: string,
  /** The notes the row itself shows, when some live elsewhere (see `withoutGroupNotes`). */
  shownNotes: ObjectNotes | undefined = objectNotes,
) {
  const notes = flattenObjectNotes(objectNotes)
  const hasNotes =
    flattenObjectNotes(shownNotes).length > 0 || drafts.some((note) => note.body.trim())
  const collapsed = isObjectSeenCollapsed({
    seenAt: effectiveSeenAt({
      seenAt,
      minorMove: change.minorMove != null,
      unseenOverride,
    }),
    latestForeignNoteAt: latestForeignNoteAt(notes, currentUser),
  })
  return { collapsed, hasNotes, drafts }
}

function isCompactReviewRow(collapsed: boolean, editing: boolean, hasNotes: boolean) {
  return collapsed && !editing && !hasNotes
}

export function DetailsChanges(props: DetailsChangesProps) {
  return (
    <PresetContextValue value={presetContextOf(props.adiff?.actions)}>
      <ChangesPanel {...props} />
    </PresetContextValue>
  )
}

function ChangesPanel({
  changesetId,
  adiff,
  workAreas = NO_WORK_AREAS,
  activeWorkArea = null,
  jumpToWorkArea,
  features = NO_FLAGGED,
  reviewedFeatures = NO_REVIEWED,
  reasons = NO_REASONS,
  selected,
  selectedRef,
  selectRef,
  deepLinkReveal,
  deepLinkEpoch = 0,
  zoomToAndSelect,
  zoomToGroup,
  clearSelection,
}: DetailsChangesProps) {
  const { data: discussion } = useChangesetDiscussion(changesetId, {
    pollWhileActive: true,
  })
  const userKey = useNotesUserKey()
  const { requestFinishFocus } = useReviewFocusActions()
  // Explicit: the compiler does not memoize these here, and new change objects re-render every row.
  const flagged = useMemo(
    () => mergeFlaggedFeatures(features, reviewedFeatures),
    [features, reviewedFeatures],
  )
  const changes = buildElementChanges(adiff?.actions, flagged, reasons)
  const located = useMemo(() => {
    const { listedObjects, keysByObject } = listedObjectsFromChanges(changes)
    return locateNotes(discussion?.changeset?.comments ?? [], {
      changesetId,
      listedObjects,
      keysByObject,
    })
  }, [changes, discussion, changesetId])
  const totalNotes = countLocatedNotes(located)
  const currentUser = userKey === 'anonymous' ? undefined : userKey

  const tagGroups = tagGroupsOf(changes, workAreas)

  function isUnseen(change: ElementChange) {
    const objectKey = objectRefKey(change.type, change.id)
    return !reviewState(
      change,
      objectSeenOf(getSeenState(userKey, changesetId), objectKey),
      located.byObject.get(objectKey),
      [],
      currentUser,
    ).collapsed
  }

  const moveOnAfterSeen = useReviewCursorKeys({
    changesetId,
    userKey,
    tagGroups,
    isUnseen,
    zoomToAndSelect,
    zoomToGroup,
    clearSelection,
  })

  if (!adiff) {
    return <Loading className="pt-10" />
  }

  if (changes.length === 0 && totalNotes === 0) {
    return (
      <p className={clsx('px-2.5 py-6 text-center text-zinc-500', typeScale.body)}>
        No element changes in this changeset.
      </p>
    )
  }

  return (
    <MoveOnAfterSeenContext value={moveOnAfterSeen}>
      <section className="flex flex-col gap-2.5 p-2.5">
        <ChangesNotesHeader count={totalNotes} />
        <ChangesetNotesSection notes={located.changesetNotes} />
        {tagGroups.sectioned ? (
          tagGroups.sections.map(({ area, changes: areaChanges, items, minorMoves }) => (
            <section
              key={area?.id ?? 'elsewhere'}
              id={area ? workAreaSectionDomId(area.id) : undefined}
              aria-label={area ? `Area ${area.id}` : 'Other'}
            >
              <WorkAreaHeading
                area={area}
                count={areaChanges.length}
                current={area != null && activeWorkArea === area.id}
                onJump={jumpToWorkArea}
              />
              <ChangeList
                items={items}
                minorMoves={minorMoves}
                tagGroups={tagGroups}
                changesetId={changesetId}
                userKey={userKey}
                selected={selected}
                selectedRef={selectedRef}
                selectRef={selectRef}
                deepLinkReveal={deepLinkReveal}
                deepLinkEpoch={deepLinkEpoch}
                zoomToAndSelect={zoomToAndSelect}
                notesByObject={located.byObject}
              />
            </section>
          ))
        ) : (
          <ChangeList
            items={tagGroups.sections[0]?.items ?? []}
            minorMoves={tagGroups.sections[0]?.minorMoves ?? []}
            tagGroups={tagGroups}
            changesetId={changesetId}
            userKey={userKey}
            selected={selected}
            selectedRef={selectedRef}
            selectRef={selectRef}
            deepLinkReveal={deepLinkReveal}
            deepLinkEpoch={deepLinkEpoch}
            zoomToAndSelect={zoomToAndSelect}
            notesByObject={located.byObject}
          />
        )}
        <OtherNotesSection notes={located.unmatched} />
        <FinishReviewCard changesetId={changesetId} selectRef={selectRef} />
        <UnsentNotesBar
          changesetId={changesetId}
          onFinish={() => requestFinishFocus(changesetId)}
        />
      </section>
    </MoveOnAfterSeenContext>
  )
}

/** Section title in the Changes list; jumps the map to that work area. */
function WorkAreaHeading({
  area,
  count,
  current,
  onJump,
}: {
  area: WorkArea | null
  count: number
  current: boolean
  onJump?: (area: WorkArea | null) => void
}) {
  // Phone sheet: stick below the sticky tabs (`--changes-sticky-top`); desktop: at the top.
  const stickyClassName =
    'sticky top-[var(--changes-sticky-top,0px)] z-10 border-b border-zinc-200 bg-white'
  const rowClassName = clsx(
    typeScale.body,
    'flex min-h-11 w-full items-center gap-2 px-2 font-medium sm:min-h-9',
  )
  if (!area) {
    return (
      <h3 className={clsx(stickyClassName, rowClassName, 'text-zinc-500')}>
        Other changes <Badge>{count}</Badge>
      </h3>
    )
  }
  return (
    <h3 className={stickyClassName}>
      <button
        type="button"
        aria-label={`Show area ${area.id} on map`}
        aria-pressed={current}
        onClick={() => onJump?.(area)}
        className={clsx(
          rowClassName,
          'cursor-pointer touch-manipulation text-left select-none hover:bg-zinc-50 active:bg-zinc-950/5',
          current ? 'text-blue-700' : 'text-zinc-950',
        )}
      >
        {/* Same look as the outline on the map. */}
        <span
          aria-hidden
          className="size-3 flex-none rounded-xs ring-2 ring-fuchsia-600/25 outline-1 outline-fuchsia-600"
        />
        Area {area.id}
        <Badge color={current ? 'blue' : 'zinc'}>{count}</Badge>
        <MapPinIcon className="ml-auto size-4 flex-none text-zinc-400" />
      </button>
    </h3>
  )
}

function ChangeList({
  items,
  minorMoves,
  tagGroups,
  changesetId,
  userKey,
  selected,
  selectedRef,
  selectRef,
  deepLinkReveal,
  deepLinkEpoch,
  zoomToAndSelect,
  notesByObject,
}: {
  items: ChangeListItem[]
  minorMoves: ElementChange[]
  tagGroups: TagGroups
  changesetId: number
  userKey: string
  selected?: AdiffAction | null
  selectedRef?: RefParam | null
  selectRef: (ref: RefParam | null) => void
  deepLinkReveal?: RefParam | null
  deepLinkEpoch?: number
  zoomToAndSelect: (type: string, id: number, key?: string) => void
  notesByObject: Map<string, ObjectNotes>
}) {
  const selectedIndex = items.findIndex((group) =>
    group.some((change) => isSelected(change, selected)),
  )
  // The first render draws the top of the list (and the selected item); React draws the rest in the
  // background, in slices that keep the page responsive. A big changeset blocked the first paint
  // for its whole list before.
  const shownItems = useDeferredValue(
    Number.POSITIVE_INFINITY,
    Math.max(FIRST_RENDER_LIST_ITEMS, selectedIndex + 1),
  )
  const showMinorMoves =
    minorMoves.length > 0 &&
    (shownItems >= items.length || minorMoves.some((change) => isSelected(change, selected)))
  return (
    <ul>
      {items
        .slice(0, shownItems)
        .map((group) =>
          group.length === 1 ? (
            <ElementChangeRow
              key={`${group[0].type}/${group[0].id}`}
              change={group[0]}
              changesetId={changesetId}
              userKey={userKey}
              {...rowSelection(group[0], selected, selectedRef, deepLinkReveal)}
              selectRef={selectRef}
              zoomToAndSelect={zoomToAndSelect}
              objectNotes={notesByObject.get(objectRefKey(group[0].type, group[0].id))}
            />
          ) : (
            <TagMutationGroup
              key={group.map((change) => `${change.type}/${change.id}`).join(',')}
              changes={group}
              code={tagGroups.groupByMember.get(changeKey(group[0]))?.code}
              changesetId={changesetId}
              userKey={userKey}
              selected={selected}
              selectedRef={selectedRef}
              selectRef={selectRef}
              deepLinkReveal={deepLinkReveal}
              deepLinkEpoch={deepLinkEpoch}
              zoomToAndSelect={zoomToAndSelect}
              notesByObject={notesByObject}
            />
          ),
        )}
      {showMinorMoves ? (
        <MinorMovesGroup
          changes={minorMoves}
          changesetId={changesetId}
          userKey={userKey}
          selected={selected}
          selectedRef={selectedRef}
          selectRef={selectRef}
          deepLinkReveal={deepLinkReveal}
          deepLinkEpoch={deepLinkEpoch}
          zoomToAndSelect={zoomToAndSelect}
          notesByObject={notesByObject}
        />
      ) : null}
    </ul>
  )
}

function isSelected(change: ElementChange, selected?: AdiffAction | null) {
  const element = selected?.new ?? selected?.old
  return element?.type === change.type && element?.id === change.id
}

/**
 * Selection props for one row. Rows that are not selected get the same props on every selection
 * change, so `memo` skips them and a tap re-renders two rows instead of the whole list.
 */
function rowSelection(
  change: ElementChange,
  selected: AdiffAction | null | undefined,
  selectedRef: RefParam | null | undefined,
  deepLinkReveal: RefParam | null | undefined,
) {
  const currentSelect = isSelected(change, selected)
  return {
    currentSelect,
    selectedRef: currentSelect ? selectedRef : null,
    deepLinkReveal: currentSelect ? deepLinkReveal : null,
  }
}

function elementRowHighlightClassName(selected: boolean, hovered: boolean) {
  if (selected) {
    // Inside the row only: an outer ring is cut off where the list clips its sides.
    // The yellow ring says where the cursor is; a focus ring on top would only repeat it.
    return 'bg-yellow-50 inset-ring-2 inset-ring-yellow-400 outline-hidden'
  }
  if (hovered) return 'bg-zinc-100'
  return 'hover:bg-zinc-50 active:bg-zinc-950/5'
}

/** Same in every state: the selection's inset ring takes no space, so the content must not shift. */
const ELEMENT_ROW_PADDING_CLASS_NAME = 'px-2 py-1'

function TagMutationGroup({
  changes,
  code,
  changesetId,
  userKey,
  selected,
  selectedRef,
  selectRef,
  deepLinkReveal,
  deepLinkEpoch,
  zoomToAndSelect,
  notesByObject,
}: {
  changes: NonEmptyArray<ElementChange>
  /** Short group name, shared with the map outline (see `tagGroups.ts`). */
  code?: string
  changesetId: number
  userKey: string
  selected?: AdiffAction | null
  selectedRef?: RefParam | null
  selectRef: (ref: RefParam | null) => void
  deepLinkReveal?: RefParam | null
  deepLinkEpoch?: number
  zoomToAndSelect: (type: string, id: number, key?: string) => void
  notesByObject: Map<string, ObjectNotes>
}) {
  const seenMap = useSeenMap(userKey, changesetId)
  const unseenOverrides = useUnseenOverrides(userKey, changesetId)
  const groupDrafts = useDraftsForObjects(userKey, changesetId, objectKeysOf(changes))
  const { markAllSeen, markAllUnseen, toggleEditor, openOrCreateEditor } =
    useChangesetNotesActions()
  const moveOnAfterSeen = use(MoveOnAfterSeenContext)
  const openEditorNoteId = useOpenEditorNoteId(changesetId)
  const hoveredInGroup = useIsAnyElementHovered(changes)
  const currentUser = userKey === 'anonymous' ? undefined : userKey
  const mutations = tagMutationRows(changes[0].tags)
  const sharedPresetLine = useSharedPresetLine(changes)
  const selectedInGroup = changes.find((change) => isSelected(change, selected))
  const containsSelected = selectedInGroup != null
  const cursorOnGroup = useIsGroupCursor(changeKey(changes[0]))
  const revealInGroup = tagGroupContainsRef(changes, deepLinkReveal)
  const disclosureKey = selectedInGroup ? `${selectedInGroup.type}/${selectedInGroup.id}` : 'none'
  const groupNoteCountByKey = aggregateNoteCountByKey(changes, notesByObject)
  const highlightTagKey = revealInGroup && deepLinkReveal?.key ? deepLinkReveal.key : undefined
  // The notes about the whole group live in the group panel; the member rows leave them out.
  const groupThreads = collectGroupThreads(changes, notesByObject)
  const memberStates = changes
    .map((change) => {
      const notes = notesByObject.get(objectRefKey(change.type, change.id))
      return {
        change,
        ...reviewState(
          change,
          objectSeenOf({ seenMap, unseenOverrides }, objectRefKey(change.type, change.id)),
          notes,
          draftsOn(groupDrafts, change.type, change.id).filter((note) => note.group == null),
          currentUser,
          withoutGroupNotes(notes),
        ),
      }
    })
    .sort((left, right) => Number(right.hasNotes) - Number(left.hasNotes))
  const editingNote =
    openEditorNoteId != null ? groupDrafts.find((note) => note.id === openEditorNoteId) : undefined
  const editingInGroup =
    editingNote?.ref != null &&
    changes.some(
      (change) => change.type === editingNote.ref?.type && change.id === editingNote.ref.id,
    )
  const groupEditingNote = editingInGroup && editingNote?.group != null ? editingNote : undefined
  const groupHasNotes =
    groupThreads.length > 0 ||
    groupDrafts.some((note) => note.group != null && note.body.trim() !== '')
  const keepOpen = editingInGroup || groupHasNotes || memberStates.some((member) => member.hasNotes)
  const forceOpen = keepOpen || containsSelected || revealInGroup
  const activeNoteKey = groupEditingNote?.ref?.key
  const allSeen = memberStates.every((member) => member.collapsed)
  const [flashKey, setFlashKey] = useState<string | null>(null)
  const [flashNonce, setFlashNonce] = useState(0)
  const [flashedReveal, setFlashedReveal] = useState<RefParam | null>(null)
  // A link to a group note: flash its thread once, as soon as the notes are there.
  if (
    revealInGroup &&
    deepLinkReveal?.key != null &&
    flashedReveal !== deepLinkReveal &&
    groupThreads.some((thread) => thread.key === deepLinkReveal.key)
  ) {
    setFlashedReveal(deepLinkReveal)
    setFlashKey(deepLinkReveal.key)
    setFlashNonce((nonce) => nonce + 1)
  }

  useEffect(
    function clearGroupThreadFlash() {
      if (flashKey == null) return
      const timeout = window.setTimeout(() => setFlashKey(null), NOTE_THREAD_FLASH_MS)
      return function cancelGroupThreadFlash() {
        window.clearTimeout(timeout)
      }
    },
    [flashKey, flashNonce],
  )

  // Open until every member is seen. Seeing the last one closes the group after a pause, so the
  // rows first show their new state and the group then folds away.
  const [open, setOpen] = useState(forceOpen || !allSeen)
  const [closingAfterSeen, setClosingAfterSeen] = useState(false)
  const [prevAllSeen, setPrevAllSeen] = useState(allSeen)
  const openRequest = `${disclosureKey}:${forceOpen}:${deepLinkEpoch ?? 0}`
  const [prevOpenRequest, setPrevOpenRequest] = useState(openRequest)
  if (prevAllSeen !== allSeen) {
    setPrevAllSeen(allSeen)
    if (allSeen && !keepOpen) {
      setOpen(false)
      setClosingAfterSeen(true)
    }
    if (!allSeen) {
      setOpen(true)
      setClosingAfterSeen(false)
    }
  }
  if (prevOpenRequest !== openRequest) {
    setPrevOpenRequest(openRequest)
    if (forceOpen) {
      setOpen(true)
      setClosingAfterSeen(false)
    }
  }

  function toggleOpen() {
    setOpen((current) => !current)
    setClosingAfterSeen(false)
  }

  function toggleAllSeen() {
    const objectKeys = changes.map((change) => objectRefKey(change.type, change.id))
    if (allSeen) {
      markAllUnseen(userKey, changesetId, objectKeys)
    } else {
      markAllSeen(userKey, changesetId, objectKeys)
      moveOnAfterSeen({ on: 'group', changes })
    }
  }

  const foldTransition = closingAfterSeen
    ? { ...disclosureTransition, delay: SEEN_FOLD_DELAY_S }
    : disclosureTransition
  const panelId = `same-tags-${changes[0].type}-${changes[0].id}`
  const groupTarget = groupHeaderTarget(changes[0])
  const groupLabel = `${code ? `Group ${code}: ` : ''}${changes.length} elements with the same tag changes`

  function targetChangeForTag(key: string) {
    if (selectedInGroup) return selectedInGroup
    const withNotes = changes.find((change) => {
      const notes = notesByObject.get(objectRefKey(change.type, change.id))
      return (notes?.byKey.get(key)?.length ?? 0) > 0
    })
    return withNotes ?? changes[0]
  }

  function selectGroupTag(key: string) {
    const target = targetChangeForTag(key)
    zoomToAndSelect(target.type, target.id, key)
  }

  /** The ref a note on the whole group gets: its first member and the tag, as posted in the link. */
  function groupNoteRef(key: string) {
    return refParamFromElement(changes[0].type, changes[0].id, key)
  }

  /** Opens the editor in the group panel. No member is selected: the note is not about one. */
  function addNoteOnGroupTag(key: string) {
    const nextRef = groupNoteRef(key)
    if (nextRef) toggleEditor(userKey, changesetId, nextRef, changes.length)
  }

  function replyOnGroupThread(key: string) {
    const nextRef = groupNoteRef(key)
    if (nextRef) openOrCreateEditor(userKey, changesetId, nextRef, changes.length)
  }

  /** The note count badge: select the target, scroll to the thread and flash it. No editor. */
  function showGroupTagThread(key: string) {
    if (groupThreads.some((thread) => thread.key === key)) {
      const target = targetChangeForTag(key)
      const nextRef = refParamFromElement(target.type, target.id, key)
      if (nextRef) selectRef(nextRef)
      document
        .getElementById(groupThreadDomId(changes[0].type, changes[0].id, key))
        ?.scrollIntoView({ block: 'nearest' })
      setFlashKey(key)
      setFlashNonce((nonce) => nonce + 1)
      return
    }
    // A note on one member's own row: select that member, its row shows the thread.
    const owner =
      changes.find(
        (change) =>
          (withoutGroupNotes(notesByObject.get(objectRefKey(change.type, change.id)))?.byKey.get(
            key,
          )?.length ?? 0) > 0,
      ) ?? targetChangeForTag(key)
    const nextRef = refParamFromElement(owner.type, owner.id, key)
    if (nextRef) selectRef(nextRef)
    const thread = document.getElementById(noteThreadDomId(owner.type, owner.id, key))
    thread?.scrollIntoView({ block: 'nearest' })
    flashNoteThreadElement(thread)
  }

  return (
    <li
      className={clsx(
        'px-2',
        // Closed groups stack tightly; only an open one needs air around it.
        open ? 'py-2' : 'py-px',
        !containsSelected && !cursorOnGroup && OFFSCREEN_ROW_CLASSNAME,
      )}
      style={offscreenRowStyle(
        open
          ? estimatedGroupPx({ members: changes.length, tagRows: mutations.length })
          : estimatedGroupPx({ members: 0, tagRows: 0 }),
      )}
    >
      {/* The review cursor's place in the group: focused itself, so Enter is not the button's. */}
      <div
        id={changeRowDomId(groupTarget.type, groupTarget.id)}
        role="group"
        aria-label={groupLabel}
        aria-current={cursorOnGroup || undefined}
        tabIndex={-1}
        className={clsx(
          '-mx-1 flex items-center gap-2 rounded px-1',
          cursorOnGroup && elementRowHighlightClassName(true, false),
        )}
      >
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={groupLabel}
          onClick={toggleOpen}
          className={clsx(
            'flex min-h-11 min-w-0 flex-1 cursor-pointer touch-manipulation items-center gap-2 rounded px-1 text-left text-sm font-medium select-none active:bg-zinc-950/5 sm:min-h-8',
            !open && hoveredInGroup ? 'bg-zinc-100' : 'hover:bg-zinc-50',
          )}
        >
          <motion.span
            className="inline-flex origin-center"
            initial={false}
            animate={{ rotate: open ? 90 : 0 }}
            transition={foldTransition}
          >
            <ChevronRightIcon className="size-4 flex-none" />
          </motion.span>
          <ActionTypeLabel actionType={actionLabelKey(changes[0])} />
          {code ? <TagGroupCode code={code} /> : null}
          <span className="truncate" title={sharedPresetLine}>
            {changes.length}× {sharedPresetLine ?? 'Same tag changes'}
          </span>
        </button>
        <MarkSeenButton
          label={allSeen ? `Mark all ${changes.length} unseen` : `Mark all ${changes.length} seen`}
          pressed={allSeen}
          onClick={toggleAllSeen}
        />
      </div>
      <motion.div
        id={panelId}
        initial={false}
        animate={open ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
        transition={foldTransition}
        className="overflow-hidden"
        inert={!open}
      >
        <p className={clsx(typeScale.small, 'px-1 pt-1 pb-3 pl-7 text-zinc-500')}>
          {TAG_GROUP_EXPLANATION}
        </p>
        <div className="border-t font-mono">
          <TagRows
            rows={mutations}
            emptyLabel="No tag changes"
            highlightedKey={highlightTagKey}
            onKeyClick={selectGroupTag}
            noteCountByKey={groupNoteCountByKey}
            onNoteCountClick={showGroupTagThread}
            onAddNote={addNoteOnGroupTag}
            activeNoteKey={activeNoteKey}
          />
        </div>
        {groupEditingNote ? (
          <div className="mt-1">
            <NoteEditor
              changesetId={changesetId}
              note={groupEditingNote}
              autoFocus={!prefersTouchInput()}
            />
          </div>
        ) : null}
        <GroupNotesBlock
          first={changes[0]}
          memberCount={changes.length}
          threads={groupThreads}
          drafts={groupDrafts.filter(
            (note) => note.group != null && note.id !== groupEditingNote?.id,
          )}
          flashKey={flashKey}
          editingKey={activeNoteKey}
          onReply={replyOnGroupThread}
          onHeaderClick={selectGroupTag}
        />
        <ul>
          {memberStates.map(({ change }) => (
            <ElementChangeRow
              key={`${change.type}/${change.id}`}
              change={change}
              changesetId={changesetId}
              userKey={userKey}
              {...rowSelection(change, selected, selectedRef, deepLinkReveal)}
              selectRef={selectRef}
              zoomToAndSelect={zoomToAndSelect}
              showTags={false}
              showPreset={sharedPresetLine == null}
              groupNotesInPanel
              objectNotes={notesByObject.get(objectRefKey(change.type, change.id))}
            />
          ))}
        </ul>
      </motion.div>
    </li>
  )
}

/** The group's short name: a soft badge in the group's colour, like its shape on the map. */
function TagGroupCode({ code }: { code: string }) {
  return (
    <span
      className="rounded-md px-[5px] py-px text-sm/5 font-semibold sm:text-xs/5"
      style={{
        ...TAG_GROUP_CODE_STYLE,
        backgroundColor: TAG_GROUP_FILL,
        boxShadow: `inset 0 0 0 1px ${TAG_GROUP_EDGE}`,
      }}
    >
      <span aria-hidden>{code}</span>
      <span className="sr-only">Group {code}</span>
    </span>
  )
}

/**
 * Moves too small to review (see `minorMoveOf`) count as seen. They sit in one collapsed group
 * after the other changes, so they do not take attention but can still be opened and un-seen.
 */
function MinorMovesGroup({
  changes,
  changesetId,
  userKey,
  selected,
  selectedRef,
  selectRef,
  deepLinkReveal,
  deepLinkEpoch,
  zoomToAndSelect,
  notesByObject,
}: {
  changes: ElementChange[]
  changesetId: number
  userKey: string
  selected?: AdiffAction | null
  selectedRef?: RefParam | null
  selectRef: (ref: RefParam | null) => void
  deepLinkReveal?: RefParam | null
  deepLinkEpoch?: number
  zoomToAndSelect: (type: string, id: number, key?: string) => void
  notesByObject: Map<string, ObjectNotes>
}) {
  const groupDrafts = useDraftsForObjects(userKey, changesetId, objectKeysOf(changes))
  const openEditorNoteId = useOpenEditorNoteId(changesetId)
  const hoveredInGroup = useIsAnyElementHovered(changes)
  const selectedInGroup = changes.find((change) => isSelected(change, selected))
  const editingNote =
    openEditorNoteId != null ? groupDrafts.find((note) => note.id === openEditorNoteId) : undefined
  const editingInGroup =
    editingNote?.ref != null &&
    changes.some(
      (change) => change.type === editingNote.ref?.type && change.id === editingNote.ref.id,
    )
  const hasNotes = changes.some(
    (change) =>
      flattenObjectNotes(notesByObject.get(objectRefKey(change.type, change.id))).length > 0 ||
      draftsOn(groupDrafts, change.type, change.id).some((note) => note.body.trim()),
  )
  const forceOpen =
    editingInGroup ||
    hasNotes ||
    selectedInGroup != null ||
    tagGroupContainsRef(changes, deepLinkReveal)
  const disclosureKey = selectedInGroup ? `${selectedInGroup.type}/${selectedInGroup.id}` : 'none'

  return (
    <li className="px-2 py-px">
      <Headless.Disclosure
        key={`${disclosureKey}:${forceOpen ? 'open' : 'closed'}:${deepLinkEpoch ?? 0}`}
        defaultOpen={forceOpen}
      >
        {({ open }: { open: boolean }) => (
          <>
            <Headless.DisclosureButton
              aria-label={`${changes.length} minor moves`}
              className={clsx(
                'flex min-h-11 w-full min-w-0 cursor-pointer touch-manipulation items-center gap-2 rounded px-1 text-left text-sm font-medium text-zinc-600 select-none active:bg-zinc-950/5 sm:min-h-8',
                !open && hoveredInGroup ? 'bg-zinc-100' : 'hover:bg-zinc-50',
              )}
            >
              <motion.span
                className="inline-flex origin-center"
                initial={false}
                animate={{ rotate: open ? 90 : 0 }}
                transition={disclosureTransition}
              >
                <ChevronRightIcon className="size-4 flex-none" />
              </motion.span>
              <span>Minor moves</span>
              <Badge>{changes.length}</Badge>
            </Headless.DisclosureButton>
            <Headless.DisclosurePanel static>
              <motion.div
                initial={false}
                animate={open ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                transition={disclosureTransition}
                className="overflow-hidden"
                inert={!open}
              >
                <p className={clsx(typeScale.small, 'px-1 pt-1 pb-3 pl-7 text-zinc-500')}>
                  {MINOR_MOVES_EXPLANATION}
                </p>
                <ul>
                  {changes.map((change) => (
                    <ElementChangeRow
                      key={`${change.type}/${change.id}`}
                      change={change}
                      changesetId={changesetId}
                      userKey={userKey}
                      {...rowSelection(change, selected, selectedRef, deepLinkReveal)}
                      selectRef={selectRef}
                      zoomToAndSelect={zoomToAndSelect}
                      showPreset={false}
                      objectNotes={notesByObject.get(objectRefKey(change.type, change.id))}
                    />
                  ))}
                </ul>
              </motion.div>
            </Headless.DisclosurePanel>
          </>
        )}
      </Headless.Disclosure>
    </li>
  )
}

const ElementChangeRow = memo(function ElementChangeRow({
  change,
  changesetId,
  userKey,
  currentSelect,
  selectedRef,
  selectRef,
  deepLinkReveal,
  zoomToAndSelect,
  showTags = true,
  showPreset = true,
  groupNotesInPanel = false,
  objectNotes,
}: {
  change: ElementChange
  changesetId: number
  userKey: string
  currentSelect: boolean
  selectedRef?: RefParam | null
  selectRef: (ref: RefParam | null) => void
  deepLinkReveal?: RefParam | null
  zoomToAndSelect: (type: string, id: number, key?: string) => void
  showTags?: boolean
  /** False in a group that shows the shared preset once, and in minor moves. */
  showPreset?: boolean
  /** In a group's panel: the notes about the whole group show there, not in this row. */
  groupNotesInPanel?: boolean
  objectNotes?: ObjectNotes
}) {
  const objectKey = objectRefKey(change.type, change.id)
  const seenAt = useObjectSeenAt(userKey, changesetId, objectKey)
  const unseenOverride = useIsUnseenOverride(userKey, changesetId, objectKey)
  const objectDrafts = useObjectDrafts(userKey, changesetId, change.type, change.id)
  const openEditorNoteId = useOpenEditorNoteId(changesetId)
  const { markSeen, markUnseen, toggleEditor, openOrCreateEditor } = useChangesetNotesActions()
  const { setHover } = useChangesetHoverActions()
  const moveOnAfterSeen = use(MoveOnAfterSeenContext)
  const hovered = useIsElementHovered(change.type, change.id)
  const currentUser = userKey === 'anonymous' ? undefined : userKey
  const pickedOnMap = useIsListScrollTarget(change.type, change.id)
  // Seen state looks at all notes; what the row shows leaves out the group's, which are in the panel.
  const shownNotes = groupNotesInPanel ? withoutGroupNotes(objectNotes) : objectNotes
  const { collapsed, hasNotes, drafts } = reviewState(
    change,
    { seenAt, unseenOverride },
    objectNotes,
    groupNotesInPanel ? objectDrafts.filter((note) => note.group == null) : objectDrafts,
    currentUser,
    shownNotes,
  )
  const editingNote =
    openEditorNoteId != null ? drafts.find((note) => note.id === openEditorNoteId) : undefined
  const [flash, setFlash] = useState(false)
  const [flashedReveal, setFlashedReveal] = useState<RefParam | null>(null)
  const [flashKey, setFlashKey] = useState<string | null>(null)
  const [flashNonce, setFlashNonce] = useState(0)
  const shouldReveal =
    currentSelect &&
    deepLinkReveal != null &&
    deepLinkReveal.type === change.type &&
    deepLinkReveal.id === change.id
  if (shouldReveal && flashedReveal !== deepLinkReveal) {
    setFlashedReveal(deepLinkReveal)
    setFlash(true)
  }
  const flaggedLabel = [
    change.flagged?.name,
    ...(change.flagged?.reasons ?? []),
    change.flagged?.userFlag,
    change.flagged?.note,
  ]
    .filter(Boolean)
    .join(' · ')

  useEffect(
    function clearDeepLinkFlash() {
      if (!flash) return
      const timeout = window.setTimeout(() => setFlash(false), DEEP_LINK_FLASH_MS)
      return function cancelDeepLinkFlash() {
        window.clearTimeout(timeout)
      }
    },
    [flash],
  )

  useEffect(
    function clearNoteThreadFlash() {
      if (flashKey == null) return
      const timeout = window.setTimeout(() => setFlashKey(null), NOTE_THREAD_FLASH_MS)
      return function cancelNoteThreadFlash() {
        window.clearTimeout(timeout)
      }
    },
    [flashKey, flashNonce],
  )

  function selectWay(id: number) {
    zoomToAndSelect('way', id)
  }

  function addNoteOnObject() {
    const nextRef = refParamFromElement(change.type, change.id)
    if (!nextRef) return
    selectRef(nextRef)
    toggleEditor(userKey, changesetId, nextRef)
  }

  function addNoteOnTag(key: string) {
    const nextRef = refParamFromElement(change.type, change.id, key)
    if (!nextRef) return
    selectRef(nextRef)
    toggleEditor(userKey, changesetId, nextRef)
  }

  /** The note count badge: select the tag, scroll to its thread and flash it. No editor. */
  function showNoteThreadOnTag(key: string) {
    const nextRef = refParamFromElement(change.type, change.id, key)
    if (!nextRef) return
    selectRef(nextRef)
    document.getElementById(noteThreadDomId(change.type, change.id, key))?.scrollIntoView({
      block: 'nearest',
    })
    setFlashKey(key)
    setFlashNonce((nonce) => nonce + 1)
  }

  /** The Reply action of a thread: the object's own, or one on a tag. */
  function replyOnThread(key?: string) {
    const nextRef = refParamFromElement(change.type, change.id, key)
    if (!nextRef) return
    selectRef(nextRef)
    openOrCreateEditor(userKey, changesetId, nextRef)
  }

  function toggleSeen() {
    if (collapsed) {
      markUnseen(userKey, changesetId, objectKey)
      return
    }
    markSeen(userKey, changesetId, objectKey)
    moveOnAfterSeen({ on: 'row', changes: [change] })
  }

  // Picked on the map: show what it is, even when it counts as seen.
  const compact =
    isCompactReviewRow(collapsed, editingNote != null, hasNotes) && !(currentSelect && pickedOnMap)

  const presetLine = usePresetLine(change, showPreset && !compact)
  const elementName = `${change.type}/${change.id}`

  const objectNoteOpen = editingNote != null && editingNote.ref?.key == null

  if (compact) {
    return (
      <li
        id={changeRowDomId(change.type, change.id)}
        tabIndex={0}
        aria-selected={currentSelect}
        data-osm-element={`${change.type}/${change.id}`}
        className={clsx(
          'group relative flex w-full cursor-pointer touch-manipulation items-center gap-1 rounded',
          ELEMENT_ROW_PADDING_CLASS_NAME,
          elementRowHighlightClassName(currentSelect, hovered),
          !currentSelect && OFFSCREEN_ROW_CLASSNAME,
        )}
        style={offscreenRowStyle(estimatedChangeRowPx({ compact: true, tagRows: 0 }))}
        onClick={() => zoomToAndSelect(change.type, change.id)}
        onMouseEnter={() => setHover({ type: change.type, id: change.id })}
        onMouseLeave={() => setHover(null)}
      >
        <ActionTypeLabel actionType={actionLabelKey(change)} muted />
        <span className={clsx(typeScale.small, 'truncate text-zinc-600')}>
          {change.type}/{change.id}
        </span>
        {change.minorMove ? <MinorMoveBadge meters={change.minorMove.meters} /> : null}
        <div className="ml-auto">
          <ObjectReviewActions
            objectLabel={`${change.type}/${change.id}`}
            notePressed={objectNoteOpen}
            seen
            compact
            onNoteClick={addNoteOnObject}
            onSeenClick={toggleSeen}
          />
        </div>
      </li>
    )
  }

  return (
    <li
      id={changeRowDomId(change.type, change.id)}
      tabIndex={0}
      aria-selected={currentSelect}
      data-osm-element={`${change.type}/${change.id}`}
      className={clsx(
        'group relative flex w-full cursor-pointer touch-manipulation flex-col items-start justify-between gap-0.5 rounded',
        ELEMENT_ROW_PADDING_CLASS_NAME,
        elementRowHighlightClassName(currentSelect, hovered),
        !currentSelect && OFFSCREEN_ROW_CLASSNAME,
      )}
      style={offscreenRowStyle(
        estimatedChangeRowPx({
          compact: false,
          tagRows: showTags ? change.tags.length : 0,
          extraLines: (change.splitFrom != null ? 1 : 0) + (change.splitInto ? 1 : 0),
          presetLine: presetLine != null,
        }),
      )}
      onClick={() => zoomToAndSelect(change.type, change.id)}
      onMouseEnter={() => setHover({ type: change.type, id: change.id })}
      onMouseLeave={() => setHover(null)}
    >
      <div className="flex w-full items-center justify-between gap-1">
        <h3 className={clsx(typeScale.body, 'flex min-w-0 items-center gap-1 font-normal')}>
          <ActionTypeLabel actionType={actionLabelKey(change)} />
          <span className="truncate" title={presetLine}>
            {presetLine ?? elementName}
          </span>
        </h3>
        <div
          className="flex shrink-0 items-center justify-end gap-1"
          onClick={(event) => event.stopPropagation()}
        >
          {change.version != null ? (
            <span
              className={clsx(typeScale.small, 'text-zinc-500')}
              title={`Version ${change.version} of this object`}
            >
              v{change.version}
            </span>
          ) : null}
          {change.flagged ? (
            <Tooltip
              content={flaggedLabel || 'Flagged feature'}
              aria-label={`Show flagged ${change.type}/${change.id} on map`}
              onClick={() => zoomToAndSelect(change.type, change.id)}
              placement="bottom-end"
              className="inline-flex justify-center"
            >
              <Badge color="orange">
                <ExclamationTriangleIcon variant="fill" className="size-3.5" />
                {change.flagged.reasons[0] ?? change.flagged.name ?? 'Flagged'}
              </Badge>
            </Tooltip>
          ) : null}
          {change.geometry === 'moved' ? (
            <Tooltip
              as="span"
              placement="bottom-end"
              content={
                change.type === 'way'
                  ? 'This way’s nodes were moved; membership and tags did not change.'
                  : 'This node was moved to a new location.'
              }
              className="inline-flex"
            >
              <Badge color="yellow">Moved</Badge>
            </Tooltip>
          ) : null}
          {change.minorMove ? <MinorMoveBadge meters={change.minorMove.meters} /> : null}
          {change.geometry === 'rewritten' ? (
            // A split keeps the original id on one part, which therefore lost nodes.
            <Tooltip
              as="span"
              placement="bottom-end"
              content={
                change.splitInto
                  ? `This way was split. It keeps its id and history; the cut-off part is now ${change.splitInto.map((id) => `way/${id}`).join(', ')}.`
                  : 'This way’s nodes changed (added, removed, or reordered), so its shape changed.'
              }
              className="inline-flex"
            >
              <Badge color="yellow">{change.splitInto ? 'Shortened' : 'Reshaped'}</Badge>
            </Tooltip>
          ) : null}
          {change.nodeStats ? (
            <Tooltip
              as="span"
              placement="bottom-end"
              aria-label={nodeStatsAriaLabel(change.nodeStats)}
              content={<NodeStatsTooltip stats={change.nodeStats} />}
              className="inline-flex"
            >
              <Badge color={ACTION_UI_COLOR.create} rounded="left">
                {change.nodeStats.added}
              </Badge>
              <Badge color={ACTION_UI_COLOR.modify} className="-my-1" rounded="none">
                {change.nodeStats.modified}
              </Badge>
              <Badge color={ACTION_UI_COLOR.delete} rounded="right">
                {change.nodeStats.deleted}
              </Badge>
            </Tooltip>
          ) : null}
          <DropdownOpenElement
            changesetId={changesetId}
            type={change.type}
            id={change.id}
            lat={change.lat}
            lon={change.lon}
          />
          <ObjectReviewActions
            objectLabel={`${change.type}/${change.id}`}
            notePressed={objectNoteOpen}
            seen={collapsed}
            onNoteClick={addNoteOnObject}
            onSeenClick={toggleSeen}
          />
        </div>
      </div>
      {presetLine ? (
        // Under the name: past the 14px action icon and its 4px gap, close to the title it belongs to.
        <p className={clsx(typeScale.small, '-mt-1 mb-1 w-full truncate pl-4.5 text-zinc-500')}>
          {elementName}
        </p>
      ) : null}
      {/* Own line: next to the id it squeezed the id out on narrow rows. */}
      {change.splitFrom != null ? (
        <p className={clsx(typeScale.small, ACTION.split.tagText)}>
          Split from <WayLinks ids={[change.splitFrom]} onSelect={selectWay} />
        </p>
      ) : null}
      {change.splitInto ? (
        <p className={clsx(typeScale.small, ACTION.split.tagText)}>
          Split into <WayLinks ids={change.splitInto} onSelect={selectWay} />
        </p>
      ) : null}
      {showTags ? (
        <div className="w-full border-t font-mono">
          {change.splitFrom != null &&
          change.tags.length > 0 &&
          tagMutationRows(change.tags).length === 0 ? (
            <p className={clsx('px-1 py-1 text-zinc-500', typeScale.small)}>
              Same tags as <WayLinks ids={[change.splitFrom]} onSelect={selectWay} />
            </p>
          ) : null}
          <TagRows
            rows={change.tags}
            emptyLabel="No tags"
            highlightedKey={flash && selectedRef?.key && shouldReveal ? selectedRef.key : undefined}
            onKeyClick={(key) => zoomToAndSelect(change.type, change.id, key)}
            noteCountByKey={noteCountByKey(shownNotes)}
            onNoteCountClick={showNoteThreadOnTag}
            onAddNote={addNoteOnTag}
            activeNoteKey={editingNote?.ref?.key}
          />
        </div>
      ) : null}
      {editingNote ? (
        <NoteEditor changesetId={changesetId} note={editingNote} autoFocus={!prefersTouchInput()} />
      ) : null}
      <NotesBlock
        type={change.type}
        id={change.id}
        tags={change.tags.flatMap((tag) => tagRowKeys(tag).map((key) => ({ key })))}
        notes={shownNotes}
        drafts={drafts.filter((note) => note.id !== editingNote?.id)}
        flashKey={flashKey}
        selectRef={selectRef}
        onReply={replyOnThread}
        editingKey={editingNote?.ref?.key}
        editingObject={objectNoteOpen}
      />
    </li>
  )
})

function MinorMoveBadge({ meters }: { meters: number }) {
  return (
    <Tooltip
      as="span"
      placement="bottom-end"
      content="A minor move: counts as seen automatically."
      className="inline-flex"
    >
      <Badge>{formatMoveMeters(meters)}</Badge>
    </Tooltip>
  )
}

/** A created way split off another way shows as "Split" instead of "Created". */
function actionLabelKey(change: ElementChange) {
  return change.splitFrom != null ? 'split' : change.actionType
}

/** `way/<id>` links that select that way, like clicking its row. */
function WayLinks({ ids, onSelect }: { ids: number[]; onSelect: (id: number) => void }) {
  return ids.map((id, index) => (
    <Fragment key={id}>
      {index > 0 ? ', ' : null}
      <button
        type="button"
        aria-label={`Show way/${id} on map`}
        className="relative cursor-pointer touch-manipulation underline decoration-dotted underline-offset-2 select-none after:absolute after:inset-x-0 after:-inset-y-2.5 after:content-['']"
        onClick={(event) => {
          event.stopPropagation()
          onSelect(id)
        }}
      >
        way/{id}
      </button>
    </Fragment>
  ))
}

function nodeStatsAriaLabel(stats: NodeStats) {
  if (Object.values(stats).every((value) => value === 0)) {
    return 'Only tagging was changed; no changes to the geometry were made.'
  }
  return [
    'Changes to this way:',
    `${stats.added} nodes added`,
    `${stats.modified} nodes modified`,
    `${stats.deleted} nodes deleted`,
  ].join(' ')
}

function NodeStatsTooltip({ stats }: { stats: NodeStats }) {
  if (Object.values(stats).every((value) => value === 0)) {
    return 'Only tagging was changed; no changes to the geometry were made.'
  }
  return (
    <div className="flex flex-col gap-0.5">
      <p>Changes to this way:</p>
      <p className="flex items-center gap-1">
        <span style={{ color: ACTION.create.hex }}>
          <ActionIcon action="create" className="size-3" />
        </span>
        {stats.added} nodes added
      </p>
      <p className="flex items-center gap-1">
        <span style={{ color: ACTION.modify.hex }}>
          <ActionIcon action="modify" className="size-3" />
        </span>
        {stats.modified} nodes modified
      </p>
      <p className="flex items-center gap-1">
        <span style={{ color: ACTION.delete.hex }}>
          <ActionIcon action="delete" className="size-3" />
        </span>
        {stats.deleted} nodes deleted
      </p>
    </div>
  )
}

/** Touch screens: focusing a field opens the keyboard, which a stray tap should not do. */
function prefersTouchInput() {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
}
