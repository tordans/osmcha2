import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { Fragment, useEffect, useRef, useState } from 'react'
import {
  locateNotes,
  objectRefKey,
  type LocatedNotes,
  type ObjectNotes,
} from '../../notes/locateNotes.ts'
import { useChangesetDiscussion } from '../../query/hooks/useChangesetDiscussion.ts'
import { Loading } from '../loading.tsx'
import { TagRows } from '../tag_rows.tsx'
import { Badge } from '../ui/badge.tsx'
import { Button } from '../ui/button.tsx'
import {
  CheckIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  LinkIcon,
  PencilIcon,
  PlusCircleIcon,
  TrashIcon,
} from '../ui/icons.ts'
import { Tooltip } from '../ui/tooltip.tsx'
import { typeScale } from '../ui/typography.ts'
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
import { FlagFeatureButton } from './FlagFeatureButton.tsx'
import {
  ChangesetNotesSection,
  ChangesNotesHeader,
  NotesBlock,
  OtherNotesSection,
} from './NotesBlock.tsx'
import { NOTE_THREAD_FLASH_MS, noteThreadDomId } from './noteThreadDom.ts'
import { changesetObjectUrl, refParamFromElement, type RefParam } from './refSelection.ts'

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
  setHighlight: (type: string, id: number, isHighlighted: boolean) => void
  zoomToAndSelect: (type: string, id: number) => void
}

function isUserFlagged(reviewedFeatures: ReviewedFeature[], type: string, id: number) {
  const featureParam = `${type}-${id}`
  return reviewedFeatures.some((entry) => entry.id === featureParam)
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
  setHighlight,
  zoomToAndSelect,
}: DetailsChangesProps) {
  const { data: discussion } = useChangesetDiscussion(changesetId, {
    pollWhileActive: true,
  })
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
              {groupChangesByTagMutation(actionChanges).map((group) =>
                group.length === 1 ? (
                  <ElementChangeRow
                    key={`${group[0].type}/${group[0].id}`}
                    change={group[0]}
                    changesetId={changesetId}
                    reviewedFeatures={reviewedFeatures}
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
                    reviewedFeatures={reviewedFeatures}
                    selected={selected}
                    selectedRef={selectedRef}
                    selectRef={selectRef}
                    deepLinkReveal={deepLinkReveal}
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
  reviewedFeatures,
  selected,
  selectedRef,
  selectRef,
  deepLinkReveal,
  setHighlight,
  zoomToAndSelect,
  notesByObject,
}: {
  changes: ElementChange[]
  changesetId: number
  reviewedFeatures: ReviewedFeature[]
  selected?: AdiffAction | null
  selectedRef?: RefParam | null
  selectRef: (ref: RefParam | null) => void
  deepLinkReveal?: RefParam | null
  setHighlight: (type: string, id: number, isHighlighted: boolean) => void
  zoomToAndSelect: (type: string, id: number) => void
  notesByObject: Map<string, ObjectNotes>
}) {
  const mutations = tagMutationRows(changes[0].tags)
  const selectedInGroup = changes.find((change) => isSelected(change, selected))
  const containsSelected = selectedInGroup != null
  const disclosureKey = selectedInGroup ? `${selectedInGroup.type}/${selectedInGroup.id}` : 'none'

  return (
    <li className="px-2 py-2">
      <Headless.Disclosure key={disclosureKey} defaultOpen={containsSelected}>
        {({ open }) => (
          <>
            <Headless.DisclosureButton
              aria-label={`${changes.length} elements with the same tag changes`}
              className="flex min-h-11 w-full cursor-pointer touch-manipulation items-center gap-2 rounded px-1 text-left text-sm font-medium select-none hover:bg-zinc-50 active:bg-zinc-950/5"
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
            <div className="mt-1 border-t font-mono">
              <TagRows rows={mutations} emptyLabel="No tag changes" />
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
                  {changes.map((change) => (
                    <ElementChangeRow
                      key={`${change.type}/${change.id}`}
                      change={change}
                      changesetId={changesetId}
                      reviewedFeatures={reviewedFeatures}
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
  reviewedFeatures,
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
  reviewedFeatures: ReviewedFeature[]
  selected?: AdiffAction | null
  selectedRef?: RefParam | null
  selectRef: (ref: RefParam | null) => void
  deepLinkReveal?: RefParam | null
  setHighlight: (type: string, id: number, isHighlighted: boolean) => void
  zoomToAndSelect: (type: string, id: number) => void
  showTags?: boolean
  objectNotes?: ObjectNotes
}) {
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

  function selectThisObject() {
    const nextRef = refParamFromElement(change.type, change.id)
    if (nextRef) selectRef(nextRef)
  }

  function scrollToTagNotes(key: string) {
    document.getElementById(noteThreadDomId(change.type, change.id, key))?.scrollIntoView({
      block: 'nearest',
    })
    setFlashKey(key)
    setFlashNonce((nonce) => nonce + 1)
  }

  return (
    <li
      ref={rowRef}
      className={clsx(
        'relative flex w-full cursor-pointer touch-manipulation flex-col items-start justify-between gap-1 rounded px-2 py-2',
        currentSelect ? 'bg-yellow-50' : 'hover:bg-zinc-50 active:bg-zinc-950/5',
        flash && 'ring-2 ring-yellow-400 ring-offset-1',
      )}
      onClick={selectThisObject}
      onMouseEnter={() => setHighlight(change.type, change.id, true)}
      onMouseLeave={() => setHighlight(change.type, change.id, false)}
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
                  : `Changes to this way: ${change.nodeStats.added} nodes added, ${change.nodeStats.modified} nodes modified and ${change.nodeStats.deleted} nodes deleted.`
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
          <CopyObjectLinkButton changesetId={changesetId} type={change.type} id={change.id} />
          <FlagFeatureButton
            changesetId={changesetId}
            featureId={`${change.type}/${change.id}`}
            initiallyFlagged={isUserFlagged(reviewedFeatures, change.type, change.id)}
          />
          <Button
            outline
            aria-label={`Show ${change.type}/${change.id} on map`}
            onClick={() => zoomToAndSelect(change.type, change.id)}
            className="min-h-11 min-w-11 cursor-pointer touch-manipulation p-0 select-none"
          >
            <EyeIcon data-slot="icon" />
          </Button>
          <DropdownOpenElement
            type={change.type}
            id={change.id}
            lat={change.lat}
            lon={change.lon}
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
            onNoteCountClick={scrollToTagNotes}
          />
        </div>
      ) : null}
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

function CopyObjectLinkButton({
  changesetId,
  type,
  id,
}: {
  changesetId: number
  type: ElementChange['type']
  id: number
}) {
  const [copied, setCopied] = useState(false)
  const objectRef = refParamFromElement(type, id)

  return (
    <Button
      outline
      type="button"
      aria-label={`Copy link to ${type}/${id}`}
      title="Copy link to this object"
      className="min-h-11 min-w-11 cursor-pointer touch-manipulation p-0 select-none"
      onClick={() => {
        if (!objectRef) return
        void navigator.clipboard.writeText(changesetObjectUrl(changesetId, objectRef)).then(() => {
          setCopied(true)
        })
      }}
    >
      {copied ? <CheckIcon data-slot="icon" /> : <LinkIcon data-slot="icon" />}
    </Button>
  )
}
