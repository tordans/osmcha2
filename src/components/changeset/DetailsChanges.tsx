import * as Headless from '@headlessui/react'
import { useHotkeys } from '@tanstack/react-hotkeys'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import {
  flattenObjectNotes,
  locateNotes,
  objectRefKey,
  type LocatedNotes,
  type ObjectNotes,
} from '../../notes/locateNotes.ts'
import {
  draftsForObject,
  isObjectSeenCollapsed,
  latestForeignNoteAt,
  type ChangesetDraft,
} from '../../notes/reviewSeen.ts'
import { useNotesUserKey } from '../../notes/useNotesUserKey.ts'
import { useChangesetDiscussion } from '../../query/hooks/useChangesetDiscussion.ts'
import {
  useChangesetHover,
  useChangesetHoverActions,
  useIsElementHovered,
  useListScrollTarget,
} from '../../stores/changeset-hover-store.ts'
import {
  useChangesetDraft,
  useChangesetNotesActions,
  useFocusedObject,
  useOpenEditor,
  useSeenMap,
} from '../../stores/changeset-notes-store.ts'
import { Loading } from '../loading.tsx'
import { TagRows } from '../tag_rows.tsx'
import { Badge } from '../ui/badge.tsx'
import { ChevronRightIcon, ExclamationTriangleIcon } from '../ui/icons.ts'
import { Tooltip } from '../ui/tooltip.tsx'
import { typeScale } from '../ui/typography.ts'
import { ACTION, ACTION_UI_COLOR } from './actionColors.ts'
import { ActionIcon, ActionTypeLabel } from './ActionTypeLabel.tsx'
import { MarkSeenButton, ObjectReviewActions } from './AddNoteButton.tsx'
import {
  buildElementChanges,
  groupChangesByTagMutation,
  groupElementChanges,
  mergeFlaggedFeatures,
  tagMutationRows,
  type AdiffAction,
  type ElementChange,
  type FlaggedFeature,
  type NamedReason,
  type NodeStats,
} from './changesetElements.ts'
import { DropdownOpenElement } from './DropdownOpenElement.tsx'
import { FinishReviewCard, UnsentNotesBar } from './FinishReviewCard.tsx'
import { NoteEditor } from './NoteEditor.tsx'
import {
  ChangesetNotesSection,
  ChangesNotesHeader,
  NotesBlock,
  OtherNotesSection,
} from './NotesBlock.tsx'
import { NOTE_THREAD_FLASH_MS, noteThreadDomId } from './noteThreadDom.ts'
import { refParamFromElement, tagGroupContainsRef, type RefParam } from './refSelection.ts'
import { changeRowDomId } from './scrollChildIntoScroller.ts'

const disclosureTransition = { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const }
const DEEP_LINK_FLASH_MS = 2000

type ReviewedFeature = { id?: string; user?: string }

type DetailsChangesProps = {
  changesetId: number
  adiff?: { actions?: AdiffAction[] } | null
  features?: FlaggedFeature[]
  reviewedFeatures?: ReviewedFeature[]
  reasons?: NamedReason[]
  selected?: AdiffAction | null
  selectedRef?: RefParam | null
  selectRef: (ref: RefParam | null) => void
  deepLinkReveal?: RefParam | null
  deepLinkEpoch?: number
  zoomToAndSelect: (type: string, id: number, key?: string) => void
}

function listedObjectsFromChanges(changes: ElementChange[]) {
  const listedObjects = new Set<string>()
  const keysByObject = new Map<string, Set<string>>()
  for (const change of changes) {
    const key = objectRefKey(change.type, change.id)
    listedObjects.add(key)
    keysByObject.set(key, new Set(change.tags.map((tag) => tag.key)))
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

function reviewState(
  change: ElementChange,
  seenMap: Record<string, string> | undefined,
  objectNotes: ObjectNotes | undefined,
  draft: ChangesetDraft | undefined,
  currentUser?: string,
) {
  const notes = flattenObjectNotes(objectNotes)
  const drafts = draftsForObject(draft, change.type, change.id)
  const hasNotes = notes.length > 0 || drafts.some((note) => note.body.trim())
  const collapsed = isObjectSeenCollapsed({
    seenAt: seenMap?.[objectRefKey(change.type, change.id)],
    latestForeignNoteAt: latestForeignNoteAt(notes, currentUser),
  })
  return { collapsed, hasNotes, drafts }
}

function isCompactReviewRow(collapsed: boolean, editing: boolean, drafts: Array<{ body: string }>) {
  return collapsed && !editing && !drafts.some((note) => note.body.trim())
}

export function DetailsChanges({
  changesetId,
  adiff,
  features = [],
  reviewedFeatures = [],
  reasons = [],
  selected,
  selectedRef,
  selectRef,
  deepLinkReveal,
  deepLinkEpoch = 0,
  zoomToAndSelect,
}: DetailsChangesProps) {
  const { data: discussion } = useChangesetDiscussion(changesetId, {
    pollWhileActive: true,
  })
  const userKey = useNotesUserKey()
  const seenMap = useSeenMap(userKey, changesetId)
  const draft = useChangesetDraft(userKey, changesetId)
  const focusedObject = useFocusedObject()
  const { markSeen, markUnseen, toggleEditor, requestFinishFocus } = useChangesetNotesActions()
  const flagged = mergeFlaggedFeatures(features, reviewedFeatures)
  const changes = buildElementChanges(adiff?.actions ?? [], flagged, reasons)
  const grouped = groupElementChanges(changes)
  const { listedObjects, keysByObject } = listedObjectsFromChanges(changes)
  const located = locateNotes(discussion?.changeset?.comments ?? [], {
    changesetId,
    listedObjects,
    keysByObject,
  })
  const totalNotes = countLocatedNotes(located)
  const currentUser = userKey === 'anonymous' ? undefined : userKey

  useHotkeys([
    {
      hotkey: 'N',
      callback: () => {
        if (!focusedObject || focusedObject.changesetId !== changesetId) return
        const nextRef = refParamFromElement(focusedObject.type, focusedObject.id)
        if (nextRef) toggleEditor(userKey, changesetId, nextRef)
      },
    },
    {
      hotkey: 'S',
      callback: () => {
        if (!focusedObject || focusedObject.changesetId !== changesetId) return
        const objectKey = objectRefKey(focusedObject.type, focusedObject.id)
        const change = changes.find(
          (item) => item.type === focusedObject.type && item.id === focusedObject.id,
        )
        if (!change) return
        const { collapsed } = reviewState(
          change,
          seenMap,
          located.byObject.get(objectKey),
          draft,
          currentUser,
        )
        if (collapsed) markUnseen(userKey, changesetId, objectKey)
        else markSeen(userKey, changesetId, objectKey)
      },
    },
  ])

  if (!adiff) {
    return <Loading className="pt-10" />
  }

  if (grouped.length === 0 && totalNotes === 0) {
    return (
      <p className={clsx('px-2.5 py-6 text-center text-zinc-500', typeScale.body)}>
        No element changes in this changeset.
      </p>
    )
  }

  return (
    <section className="flex flex-col gap-2.5 p-2.5">
      <ChangesNotesHeader count={totalNotes} />
      <ChangesetNotesSection notes={located.changesetNotes} />
      <ul>
        {grouped.map(([, actionChanges]) => {
          const groups = groupChangesByTagMutation(actionChanges)
          return groups.map((group) =>
            group.length === 1 ? (
              <ElementChangeRow
                key={`${group[0].type}/${group[0].id}`}
                change={group[0]}
                changesetId={changesetId}
                selected={selected}
                selectedRef={selectedRef}
                selectRef={selectRef}
                deepLinkReveal={deepLinkReveal}
                zoomToAndSelect={zoomToAndSelect}
                objectNotes={located.byObject.get(objectRefKey(group[0].type, group[0].id))}
              />
            ) : (
              <TagMutationGroup
                key={group.map((change) => `${change.type}/${change.id}`).join(',')}
                changes={group}
                changesetId={changesetId}
                selected={selected}
                selectedRef={selectedRef}
                selectRef={selectRef}
                deepLinkReveal={deepLinkReveal}
                deepLinkEpoch={deepLinkEpoch}
                zoomToAndSelect={zoomToAndSelect}
                notesByObject={located.byObject}
              />
            ),
          )
        })}
      </ul>
      <OtherNotesSection notes={located.unmatched} />
      <FinishReviewCard changesetId={changesetId} selectRef={selectRef} />
      <UnsentNotesBar
        changesetId={changesetId}
        onFinish={() => {
          requestFinishFocus()
          document.getElementById('finish-review')?.scrollIntoView({ block: 'nearest' })
        }}
      />
    </section>
  )
}

function isSelected(change: ElementChange, selected?: AdiffAction | null) {
  const element = selected?.new ?? selected?.old
  return element?.type === change.type && element?.id === change.id
}

function elementRowHighlightClassName(selected: boolean, hovered: boolean) {
  if (selected) {
    return 'ring-2 ring-yellow-400 inset-ring-8 inset-ring-yellow-100'
  }
  if (hovered) return 'bg-zinc-100'
  return 'hover:bg-zinc-50 active:bg-zinc-950/5'
}

function elementRowPaddingClassName(selected: boolean, compact: boolean) {
  if (compact) return selected ? 'px-3 py-2' : 'px-2 py-0.5'
  return selected ? 'px-3 py-2.5' : 'px-2 py-1'
}

function TagMutationGroup({
  changes,
  changesetId,
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
  selected?: AdiffAction | null
  selectedRef?: RefParam | null
  selectRef: (ref: RefParam | null) => void
  deepLinkReveal?: RefParam | null
  deepLinkEpoch?: number
  zoomToAndSelect: (type: string, id: number, key?: string) => void
  notesByObject: Map<string, ObjectNotes>
}) {
  const userKey = useNotesUserKey()
  const seenMap = useSeenMap(userKey, changesetId)
  const draft = useChangesetDraft(userKey, changesetId)
  const { markAllSeen, toggleEditor } = useChangesetNotesActions()
  const openEditor = useOpenEditor()
  const hover = useChangesetHover()
  const listScrollTarget = useListScrollTarget()
  const currentUser = userKey === 'anonymous' ? undefined : userKey
  const mutations = tagMutationRows(changes[0].tags)
  const selectedInGroup = changes.find((change) => isSelected(change, selected))
  const containsSelected = selectedInGroup != null
  const hoveredInGroup =
    hover != null && changes.some((change) => change.type === hover.type && change.id === hover.id)
  const scrollTargetInGroup =
    listScrollTarget != null &&
    changes.some(
      (change) => change.type === listScrollTarget.type && change.id === listScrollTarget.id,
    )
  const revealInGroup = tagGroupContainsRef(changes, deepLinkReveal)
  const disclosureKey = selectedInGroup
    ? `${selectedInGroup.type}/${selectedInGroup.id}`
    : scrollTargetInGroup && listScrollTarget
      ? `${listScrollTarget.type}/${listScrollTarget.id}`
      : 'none'
  const groupNoteCountByKey = aggregateNoteCountByKey(changes, notesByObject)
  const highlightTagKey = revealInGroup && deepLinkReveal?.key ? deepLinkReveal.key : undefined
  const memberStates = changes
    .map((change) => ({
      change,
      ...reviewState(
        change,
        seenMap,
        notesByObject.get(objectRefKey(change.type, change.id)),
        draft,
        currentUser,
      ),
    }))
    .sort((left, right) => Number(right.hasNotes) - Number(left.hasNotes))
  const editingNote =
    openEditor?.changesetId === changesetId
      ? draft?.notes.find((note) => note.id === openEditor.noteId)
      : undefined
  const editingInGroup =
    editingNote?.ref != null &&
    changes.some(
      (change) => change.type === editingNote.ref?.type && change.id === editingNote.ref.id,
    )
  const allMembersCompact = memberStates.every((member) =>
    isCompactReviewRow(member.collapsed, false, member.drafts),
  )
  const forceOpen =
    editingInGroup ||
    memberStates.some((member) => member.hasNotes) ||
    (!allMembersCompact && (containsSelected || scrollTargetInGroup || revealInGroup))
  const activeNoteKey = editingInGroup ? editingNote?.ref?.key : undefined

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

  function addNoteOnGroupTag(key: string) {
    const target = targetChangeForTag(key)
    const nextRef = refParamFromElement(target.type, target.id, key)
    if (!nextRef) return
    selectRef(nextRef)
    toggleEditor(userKey, changesetId, nextRef)
  }

  return (
    <li className="px-2 py-2">
      <Headless.Disclosure
        key={`${disclosureKey}:${forceOpen ? 'open' : 'closed'}:${deepLinkEpoch ?? 0}`}
        defaultOpen={forceOpen}
      >
        {({ open }) => (
          <>
            <div className="flex items-center gap-2">
              <Headless.DisclosureButton
                aria-label={`${changes.length} elements with the same tag changes`}
                className={clsx(
                  'flex min-h-11 min-w-0 flex-1 cursor-pointer touch-manipulation items-center gap-2 rounded px-1 text-left text-sm font-medium select-none active:bg-zinc-950/5',
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
                <ActionTypeLabel actionType={changes[0].actionType} />
                <span>Same tag changes</span>
                <Badge>{changes.length}</Badge>
              </Headless.DisclosureButton>
              <MarkSeenButton
                label={`Mark all ${changes.length} seen`}
                onClick={() =>
                  markAllSeen(
                    userKey,
                    changesetId,
                    changes.map((change) => objectRefKey(change.type, change.id)),
                  )
                }
              />
            </div>
            {open ? (
              <div className="mt-1 border-t font-mono">
                <TagRows
                  rows={mutations}
                  emptyLabel="No tag changes"
                  highlightedKey={highlightTagKey}
                  onKeyClick={selectGroupTag}
                  noteCountByKey={groupNoteCountByKey}
                  onNoteCountClick={addNoteOnGroupTag}
                  onAddNote={addNoteOnGroupTag}
                  activeNoteKey={activeNoteKey}
                />
              </div>
            ) : null}
            <Headless.DisclosurePanel static>
              <motion.div
                initial={false}
                animate={open ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                transition={disclosureTransition}
                className="overflow-hidden"
                inert={!open}
              >
                <ul>
                  {memberStates.map(({ change }) => (
                    <ElementChangeRow
                      key={`${change.type}/${change.id}`}
                      change={change}
                      changesetId={changesetId}
                      selected={selected}
                      selectedRef={selectedRef}
                      selectRef={selectRef}
                      deepLinkReveal={deepLinkReveal}
                      zoomToAndSelect={zoomToAndSelect}
                      showTags={false}
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

function ElementChangeRow({
  change,
  changesetId,
  selected,
  selectedRef,
  selectRef,
  deepLinkReveal,
  zoomToAndSelect,
  showTags = true,
  objectNotes,
}: {
  change: ElementChange
  changesetId: number
  selected?: AdiffAction | null
  selectedRef?: RefParam | null
  selectRef: (ref: RefParam | null) => void
  deepLinkReveal?: RefParam | null
  zoomToAndSelect: (type: string, id: number, key?: string) => void
  showTags?: boolean
  objectNotes?: ObjectNotes
}) {
  const userKey = useNotesUserKey()
  const seenMap = useSeenMap(userKey, changesetId)
  const draft = useChangesetDraft(userKey, changesetId)
  const openEditor = useOpenEditor()
  const { markSeen, markUnseen, toggleEditor, setFocusedObject } = useChangesetNotesActions()
  const { setHover } = useChangesetHoverActions()
  const hovered = useIsElementHovered(change.type, change.id)
  const currentUser = userKey === 'anonymous' ? undefined : userKey
  const { collapsed, hasNotes, drafts } = reviewState(
    change,
    seenMap,
    objectNotes,
    draft,
    currentUser,
  )
  const editingNote =
    openEditor?.changesetId === changesetId
      ? drafts.find((note) => note.id === openEditor.noteId)
      : undefined
  const objectKey = objectRefKey(change.type, change.id)
  const currentSelect = isSelected(change, selected)
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
    ...((change.flagged?.reasons ?? []) as string[]),
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
    document.getElementById(noteThreadDomId(change.type, change.id, key))?.scrollIntoView({
      block: 'nearest',
    })
    setFlashKey(key)
    setFlashNonce((nonce) => nonce + 1)
  }

  function toggleSeen() {
    if (collapsed) markUnseen(userKey, changesetId, objectKey)
    else markSeen(userKey, changesetId, objectKey)
  }

  const compact = isCompactReviewRow(collapsed, editingNote != null, drafts)

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
          elementRowPaddingClassName(currentSelect, true),
          elementRowHighlightClassName(currentSelect, hovered),
        )}
        onClick={() => zoomToAndSelect(change.type, change.id)}
        onMouseEnter={() => setHover({ type: change.type, id: change.id })}
        onMouseLeave={() => setHover(null)}
        onFocus={() => setFocusedObject({ changesetId, type: change.type, id: change.id })}
      >
        <ActionTypeLabel actionType={change.actionType} muted />
        <span className={clsx(typeScale.small, 'truncate text-zinc-600')}>
          {change.type}/{change.id}
        </span>
        {hasNotes ? (
          <Badge>
            {flattenObjectNotes(objectNotes).length +
              drafts.filter((note) => note.body.trim()).length}
          </Badge>
        ) : null}
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
        elementRowPaddingClassName(currentSelect, false),
        elementRowHighlightClassName(currentSelect, hovered),
      )}
      onClick={() => zoomToAndSelect(change.type, change.id)}
      onMouseEnter={() => setHover({ type: change.type, id: change.id })}
      onMouseLeave={() => setHover(null)}
      onFocus={() => setFocusedObject({ changesetId, type: change.type, id: change.id })}
    >
      <div className="flex w-full items-center justify-between gap-1">
        <h3 className={clsx(typeScale.body, 'flex min-w-0 items-center gap-1 font-normal')}>
          <ActionTypeLabel actionType={change.actionType} />
          <span className="truncate">
            {change.type}/{change.id}
          </span>
          {change.version != null ? <span className="text-zinc-400">#{change.version}</span> : null}
        </h3>
        <div
          className="flex shrink-0 items-center justify-end gap-1"
          onClick={(event) => event.stopPropagation()}
        >
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
          {change.geometry === 'rewritten' ? (
            <Tooltip
              as="span"
              placement="bottom-end"
              content="This way’s member nodes changed (added, removed, or reordered), so its geometry was rewritten."
              className="inline-flex"
            >
              <Badge color="yellow">Rewritten</Badge>
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
      {showTags ? (
        <div className="w-full border-t font-mono">
          <TagRows
            rows={change.tags}
            emptyLabel="No tags"
            highlightedKey={flash && selectedRef?.key && shouldReveal ? selectedRef.key : undefined}
            onKeyClick={(key) => zoomToAndSelect(change.type, change.id, key)}
            noteCountByKey={noteCountByKey(objectNotes)}
            onNoteCountClick={addNoteOnTag}
            onAddNote={addNoteOnTag}
            activeNoteKey={editingNote?.ref?.key}
          />
        </div>
      ) : null}
      {editingNote ? <NoteEditor changesetId={changesetId} note={editingNote} autoFocus /> : null}
      <NotesBlock
        type={change.type}
        id={change.id}
        tags={change.tags}
        notes={objectNotes}
        flashKey={flashKey}
        selectRef={selectRef}
      />
    </li>
  )
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
