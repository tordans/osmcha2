import * as Headless from '@headlessui/react'
import { useHotkeys } from '@tanstack/react-hotkeys'
import { useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState, type PointerEvent, type ReactNode } from 'react'
import {
  bindingKey,
  CHANGESET_DETAILS_DETAILS,
  CHANGESET_DETAILS_DISCUSSIONS,
} from '../../config/bindings.ts'
import { paneCardClassName, paneCardClipClassName } from '../../layout/paneCard.ts'
import type { NoteTarget } from '../../notes/discussionNotes.ts'
import { useChangesetDiscussion } from '../../query/hooks/useChangesetDiscussion.ts'
import { changesetDiscussionQueryOptions } from '../../query/options/changeset.ts'
import { Badge } from '../ui/badge.tsx'
import { ChatBubbleLeftIcon } from '../ui/icons.ts'
import { Tooltip } from '../ui/tooltip.tsx'
import type { AdiffAction } from './changesetElements.ts'
import { DetailsChanges } from './DetailsChanges.tsx'
import { DetailsHeader, type ReviewChangeset, type ReviewUserDetails } from './DetailsHeader.tsx'
import { Discussions } from './discussions.tsx'
import type { RefParam } from './refSelection.ts'

const COLUMN_TABS = [
  {
    key: CHANGESET_DETAILS_DETAILS.label,
    label: 'Changes',
    hotkeys: CHANGESET_DETAILS_DETAILS.hotkeys,
  },
  {
    key: CHANGESET_DETAILS_DISCUSSIONS.label,
    label: 'Discussion',
    hotkeys: CHANGESET_DETAILS_DISCUSSIONS.hotkeys,
  },
] as const

type ReviewColumnProps = {
  changesetId: number
  currentChangeset: ReviewChangeset & { properties?: Record<string, any> }
  userDetails?: ReviewUserDetails | null
  whosThat?: string[]
  bindingsState: Record<string, boolean>
  exclusiveKeyToggle: (label: string) => void
  osmInfo?: { adiff?: { actions?: AdiffAction[] } }
  selected?: AdiffAction | null
  selectedRef?: RefParam | null
  selectRef: (ref: RefParam | null) => void
  revealRef: (target: NoteTarget) => void
  deepLinkReveal?: RefParam | null
  deepLinkEpoch?: number
  setHighlight: (type: string, id: number, isHighlighted: boolean) => void
  zoomToAndSelect: (type: string, id: number) => void
}

export function ReviewColumn({
  changesetId,
  currentChangeset,
  userDetails,
  whosThat = [],
  bindingsState,
  exclusiveKeyToggle,
  osmInfo,
  selected,
  selectedRef,
  selectRef,
  revealRef,
  deepLinkReveal,
  deepLinkEpoch = 0,
  setHighlight,
  zoomToAndSelect,
}: ReviewColumnProps) {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(() => selectedRef != null)
  const [expandedForEpoch, setExpandedForEpoch] = useState(0)
  if (deepLinkEpoch > 0 && deepLinkEpoch !== expandedForEpoch) {
    setExpandedForEpoch(deepLinkEpoch)
    setExpanded(true)
  }
  const dragStartY = useRef<number | null>(null)
  const dragged = useRef(false)
  const properties: Record<string, any> = currentChangeset.properties ?? {}
  const changesetCount =
    (properties.create ?? 0) + (properties.modify ?? 0) + (properties.delete ?? 0)
  const changesActive = Boolean(bindingsState[CHANGESET_DETAILS_DETAILS.label])
  const discussionActive = Boolean(bindingsState[CHANGESET_DETAILS_DISCUSSIONS.label])
  const { data: discussion } = useChangesetDiscussion(changesetId, {
    pollWhileActive: true,
  })
  const discussions = discussion?.changeset?.comments || []

  function revealDiscussionNote(target: NoteTarget) {
    if (!changesActive) exclusiveKeyToggle(CHANGESET_DETAILS_DETAILS.label)
    setExpanded(true)
    revealRef(target)
  }

  function selectPanel(label: string) {
    const turningOn = !bindingsState[label]
    exclusiveKeyToggle(label)
    if (turningOn) setExpanded(true)
    if (turningOn && label === CHANGESET_DETAILS_DISCUSSIONS.label) {
      void queryClient.refetchQueries({
        queryKey: changesetDiscussionQueryOptions(changesetId).queryKey,
      })
    }
  }

  useHotkeys(
    COLUMN_TABS.flatMap((tab) =>
      tab.hotkeys.map((hotkey) => ({
        hotkey,
        callback: () => selectPanel(tab.key),
      })),
    ),
  )

  function onHandlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    dragStartY.current = event.clientY
    dragged.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onHandlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (dragStartY.current == null) return
    if (Math.abs(dragStartY.current - event.clientY) > 12) {
      dragged.current = true
    }
  }

  function onHandlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (dragStartY.current == null) return
    const delta = dragStartY.current - event.clientY
    dragStartY.current = null
    if (!dragged.current) return
    setExpanded(delta > 0)
  }

  function onHandleClick() {
    if (dragged.current) return
    setExpanded((value) => !value)
  }

  return (
    <section
      className={clsx(
        'z-30 flex min-h-0 flex-col overflow-hidden bg-white',
        'absolute inset-x-0 bottom-0 rounded-t-xl shadow-lg',
        expanded ? 'h-[80%]' : 'h-auto',
        '@container/review min-[56rem]:relative min-[56rem]:inset-auto min-[56rem]:h-full min-[56rem]:w-(--pane-review-width,24rem) min-[56rem]:shrink-0 min-[56rem]:overflow-visible',
        paneCardClassName,
      )}
    >
      <div className={clsx('flex min-h-0 flex-1 flex-col', paneCardClipClassName)}>
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse review' : 'Expand review'}
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onClick={onHandleClick}
          className="flex min-h-11 w-full cursor-pointer touch-manipulation items-center justify-center select-none min-[56rem]:hidden"
        >
          <span className="h-1 w-10 rounded-full bg-zinc-300" />
        </button>

        <DetailsHeader
          changesetId={changesetId}
          currentChangeset={currentChangeset}
          userDetails={userDetails}
          whosThat={whosThat}
        />

        <div
          className={clsx(
            'min-h-0 flex-1 flex-col overflow-hidden',
            expanded ? 'flex' : 'hidden',
            'min-[56rem]:flex',
          )}
        >
          <div className="shrink-0 border-b border-zinc-200">
            <nav aria-label="Review panels" className="-mb-px flex gap-x-4 px-2.5">
              <ReviewTab
                current={changesActive}
                title={`Changes (${bindingKey(CHANGESET_DETAILS_DETAILS)})`}
                onClick={() => selectPanel(CHANGESET_DETAILS_DETAILS.label)}
              >
                Changes{' '}
                {changesetCount > 0 ? (
                  <Badge color={changesActive ? 'blue' : 'zinc'}>{changesetCount}</Badge>
                ) : null}
              </ReviewTab>
              <ReviewTab
                current={discussionActive}
                title={`Discussion (${bindingKey(CHANGESET_DETAILS_DISCUSSIONS)})`}
                onClick={() => selectPanel(CHANGESET_DETAILS_DISCUSSIONS.label)}
              >
                Discussion{' '}
                {discussions.length > 0 ? (
                  <Badge
                    color={discussionActive ? 'blue' : 'zinc'}
                    aria-label={`${discussions.length} comments`}
                    className="flex flex-none items-center gap-1"
                  >
                    <ChatBubbleLeftIcon variant="fill" className="size-4" /> {discussions.length}
                  </Badge>
                ) : (
                  <ChatBubbleLeftIcon
                    variant="fill"
                    className={clsx('size-4', discussionActive ? 'text-blue-500' : 'text-zinc-300')}
                    aria-label="No comments"
                  />
                )}
              </ReviewTab>
            </nav>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <AnimatePresence mode="wait" initial={false}>
              {changesActive ? (
                <motion.div
                  key="changes"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <DetailsChanges
                    changesetId={changesetId}
                    adiff={osmInfo?.adiff}
                    features={properties.features ?? []}
                    reviewedFeatures={properties.reviewed_features ?? []}
                    reasons={properties.reasons ?? []}
                    selected={selected}
                    selectedRef={selectedRef}
                    selectRef={selectRef}
                    deepLinkReveal={deepLinkReveal}
                    deepLinkEpoch={deepLinkEpoch}
                    setHighlight={setHighlight}
                    zoomToAndSelect={zoomToAndSelect}
                  />
                </motion.div>
              ) : discussionActive ? (
                <motion.div
                  key="discussion"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Discussions
                    changesetAuthor={properties.user ?? ''}
                    discussions={discussions}
                    changesetIsHarmful={Boolean(properties.harmful)}
                    changesetId={changesetId}
                    revealRef={revealDiscussionNote}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

function ReviewTab({
  current,
  title,
  onClick,
  children,
}: {
  current: boolean
  title: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Tooltip as="span" content={title} className="inline-flex">
      <Headless.Button
        type="button"
        aria-current={current ? 'page' : undefined}
        onClick={onClick}
        className={clsx(
          'relative flex min-h-11 cursor-pointer touch-manipulation items-center gap-2 border-b-2 px-3 text-sm font-medium whitespace-nowrap select-none',
          'focus:not-data-focus:outline-hidden data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-blue-500',
          current
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700',
        )}
      >
        {children}
      </Headless.Button>
    </Tooltip>
  )
}
