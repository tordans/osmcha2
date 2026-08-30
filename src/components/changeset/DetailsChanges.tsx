import * as Headless from '@headlessui/react'
import { useHotkeys } from '@tanstack/react-hotkeys'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { Fragment, useEffect, useRef, useState } from 'react'
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
  useChangesetDraft,
  useChangesetNotesActions,
  useFocusedObject,
  useOpenEditor,
  useSeenMap,
} from '../../stores/changeset-notes-store.ts'
import { Loading } from '../loading.tsx'
import { TagRows } from '../tag_rows.tsx'
import { Badge } from '../ui/badge.tsx'
import { Button } from '../ui/button.tsx'
import {
  ChevronRightIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  PlusCircleIcon,
  TrashIcon,
} from '../ui/icons.ts'
import { Tooltip } from '../ui/tooltip.tsx'
import { typeScale } from '../ui/typography.ts'
import { ObjectReviewActions } from './AddNoteButton.tsx'
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

const ACTION_LABEL = {
  create: 'Created',
  modify: 'Modified',
  delete: 'Deleted',
} as const

const ACTION_ICON = {
  create: PlusCircleIcon,
  modify: PencilIcon,
  delete: TrashIcon,
} as const

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
  setHighlight: (type: string, id: number, isHighlighted: boolean) => void
  zoomToAndSelect: (type: string, id: number) => void
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
  setHighlight,
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
      {grouped.map(([actionType, actionChanges]) => {
        const Icon = ACTION_ICON[actionType]
        const groups = groupChangesByTagMutation(actionChanges)
        return (
          <Fragment key={actionType}>
            <h2
              className={clsx(
                typeScale.heading,
                'flex items-center gap-1 rounded-sm border border-zinc-950/10 bg-zinc-50 px-2 py-1',
              )}
            >
              <Icon variant="fill" className="size-4 flex-none" /> {ACTION_LABEL[actionType]}
            </h2>
            <ul>
              {groups.map((group) =>
                group.length === 1 ? (
                  <ElementChangeRow
                    key={`${group[0].type}/${group[0].id}`}
                    change={group[0]}
                    changesetId={changesetId}
                    selected={selected}
                    selectedRef={selectedRef}
                    selectRef={selectRef}
                    deepLinkReveal={deepLinkReveal}
                    setHighlight={setHighlight}
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
                    setHighlight={setHighlight}
                    zoomToAndSelect={zoomToAndSelect}
                    notesByObject={located.byObject}
                  />
                ),
              )}
            </ul>
          </Fragment>
        )
      })}
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

function TagMutationGroup({
  changes,
  changesetId,
  selected,
  selectedRef,
  selectRef,
  deepLinkReveal,
  deepLinkEpoch,
  setHighlight,
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
  setHighlight: (type: string, id: number, isHighlighted: boolean) => void
  zoomToAndSelect: (type: string, id: number) => void
  notesByObject: Map<string, ObjectNotes>
}) {
  const userKey = useNotesUserKey()
  const seenMap = useSeenMap(userKey, changesetId)
  const draft = useChangesetDraft(userKey, changesetId)
  const { markAllSeen, toggleEditor } = useChangesetNotesActions()
  const openEditor = useOpenEditor()
  const currentUser = userKey === 'anonymous' ? undefined : userKey
  const mutations = tagMutationRows(changes[0].tags)
  const selectedInGroup = changes.find((change) => isSelected(change, selected))
  const containsSelected = selectedInGroup != null
  const revealInGroup = tagGroupContainsRef(changes, deepLinkReveal)
  const disclosureKey = selectedInGroup ? `${selectedInGroup.type}/${selectedInGroup.id}` : 'none'
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
  const forceOpen =
    containsSelected ||
    revealInGroup ||
    memberStates.some((member) => member.hasNotes) ||
    editingInGroup
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
    const nextRef = refParamFromElement(target.type, target.id, key)
    if (nextRef) selectRef(nextRef)
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
        key={`${disclosureKey}:${forceOpen ? String(deepLinkEpoch ?? 0) : '0'}`}
        defaultOpen={forceOpen}
      >
        {({ open }) => (
          <>
            <div className="flex items-center gap-2">
              <Headless.DisclosureButton
                aria-label={`${changes.length} elements with the same tag changes`}
                className="flex min-h-11 min-w-0 flex-1 cursor-pointer touch-manipulation items-center gap-2 rounded px-1 text-left text-sm font-medium select-none hover:bg-zinc-50 active:bg-zinc-950/5"
              >
                <motion.span
                  className="inline-flex origin-center"
                  initial={false}
                  animate={{ rotate: open ? 90 : 0 }}
                  transition={disclosureTransition}
                >
                  <ChevronRightIcon className="size-4 flex-none" />
                </motion.span>
                <span>Same tag changes</span>
                <Badge>{changes.length}</Badge>
              </Headless.DisclosureButton>
              <Button
                type="button"
                outline
                onClick={() =>
                  markAllSeen(
                    userKey,
                    changesetId,
                    changes.map((change) => objectRefKey(change.type, change.id)),
                  )
                }
              >
                Mark all {changes.length} seen
              </Button>
            </div>
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
                      setHighlight={setHighlight}
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
  setHighlight,
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
  setHighlight: (type: string, id: number, isHighlighted: boolean) => void
  zoomToAndSelect: (type: string, id: number) => void
  showTags?: boolean
  objectNotes?: ObjectNotes
}) {
  const userKey = useNotesUserKey()
  const seenMap = useSeenMap(userKey, changesetId)
  const draft = useChangesetDraft(userKey, changesetId)
  const openEditor = useOpenEditor()
  const { markSeen, markUnseen, toggleEditor, setFocusedObject } = useChangesetNotesActions()
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
  const Icon = ACTION_ICON[change.actionType]
  const currentSelect = isSelected(change, selected)
  const rowRef = useRef<HTMLLIElement>(null)
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
    function scrollDeepLinkedRowIntoView() {
      if (!shouldReveal) return
      rowRef.current?.scrollIntoView({ block: 'nearest' })
    },
    [shouldReveal, deepLinkReveal],
  )

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

  const compact =
    collapsed && !shouldReveal && !editingNote && !drafts.some((note) => note.body.trim())

  const objectNoteOpen = editingNote != null && editingNote.ref?.key == null

  if (compact) {
    return (
      <li
        ref={rowRef}
        tabIndex={0}
        className={clsx(
          'group relative flex min-h-11 w-full cursor-pointer items-center gap-2 rounded px-2 py-1',
          currentSelect ? 'bg-yellow-50' : 'hover:bg-zinc-50 active:bg-zinc-950/5',
          flash && 'ring-2 ring-yellow-400 ring-offset-1',
        )}
        onClick={() => zoomToAndSelect(change.type, change.id)}
        onMouseEnter={() => setHighlight(change.type, change.id, true)}
        onMouseLeave={() => setHighlight(change.type, change.id, false)}
        onFocus={() => setFocusedObject({ changesetId, type: change.type, id: change.id })}
      >
        <Icon variant="fill" className="size-4 flex-none text-zinc-400" />
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
            onNoteClick={addNoteOnObject}
            onSeenClick={toggleSeen}
          />
        </div>
      </li>
    )
  }

  return (
    <li
      ref={rowRef}
      tabIndex={0}
      className={clsx(
        'group relative flex w-full cursor-pointer touch-manipulation flex-col items-start justify-between gap-1 rounded px-2 py-2',
        currentSelect ? 'bg-yellow-50' : 'hover:bg-zinc-50 active:bg-zinc-950/5',
        flash && 'ring-2 ring-yellow-400 ring-offset-1',
      )}
      onClick={() => zoomToAndSelect(change.type, change.id)}
      onMouseEnter={() => setHighlight(change.type, change.id, true)}
      onMouseLeave={() => setHighlight(change.type, change.id, false)}
      onFocus={() => setFocusedObject({ changesetId, type: change.type, id: change.id })}
    >
      <div className="flex w-full items-center justify-between gap-1">
        <h3 className={clsx(typeScale.body, 'flex min-w-0 items-center gap-1 font-normal')}>
          <Icon variant="fill" className="size-4 flex-none" />
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
              className="min-h-11 min-w-11 justify-center"
            >
              <Badge color="orange">
                <ExclamationTriangleIcon variant="fill" className="size-3.5" />
                {change.flagged.reasons[0] ?? change.flagged.name ?? 'Flagged'}
              </Badge>
            </Tooltip>
          ) : null}
          {change.geometry === 'moved' ? <Badge color="yellow">Moved</Badge> : null}
          {change.geometry === 'rewritten' ? <Badge color="yellow">Rewritten</Badge> : null}
          {change.nodeStats ? (
            <Tooltip
              content={
                Object.values(change.nodeStats).every((value) => value === 0)
                  ? 'Only tagging was changed; no changes to the geometry were made.'
                  : [
                      'Changes to this way:',
                      `${change.nodeStats.added} nodes added`,
                      `${change.nodeStats.modified} nodes modified`,
                      `${change.nodeStats.deleted} nodes deleted`,
                    ].join('\n')
              }
              className="min-h-11"
            >
              <Badge color="blue" rounded="left">
                {change.nodeStats.added}
              </Badge>
              <Badge color="yellow" className="-my-1" rounded="none">
                {change.nodeStats.modified}
              </Badge>
              <Badge color="red" rounded="right">
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
            onKeyClick={(key) => {
              const nextRef = refParamFromElement(change.type, change.id, key)
              if (nextRef) selectRef(nextRef)
            }}
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
