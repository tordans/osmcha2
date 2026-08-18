import * as Headless from '@headlessui/react'
import { ChatBubbleLeftIcon } from '@heroicons/react/16/solid'
import clsx from 'clsx'
import Mousetrap from 'mousetrap'
import { useEffect, useEffectEvent, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import {
  CHANGESET_DETAILS_DETAILS,
  CHANGESET_DETAILS_DISCUSSIONS,
  CHANGESET_DETAILS_USER,
} from '../../config/bindings.ts'
import { Badge } from '../ui/badge.tsx'
import { DetailsChanges } from './DetailsChanges.tsx'
import { DetailsHeader, type ReviewChangeset, type ReviewUserDetails } from './DetailsHeader.tsx'
import { Discussions } from './discussions.tsx'
import type { AdiffAction } from './changesetElements.ts'
import type { ReviewCamera } from './openInUrls.ts'

const COLUMN_TABS = [
  {
    key: CHANGESET_DETAILS_DETAILS.label,
    label: 'Changes',
    bindings: CHANGESET_DETAILS_DETAILS.bindings,
  },
  {
    key: CHANGESET_DETAILS_DISCUSSIONS.label,
    label: 'Discussion',
    bindings: CHANGESET_DETAILS_DISCUSSIONS.bindings,
  },
] as const

type ReviewColumnProps = {
  changesetId: number
  currentChangeset: ReviewChangeset & { properties?: Record<string, any> }
  camera?: ReviewCamera | null
  userDetails?: ReviewUserDetails | null
  whosThat?: string[]
  bindingsState: Record<string, boolean>
  exclusiveKeyToggle: (label: string) => void
  osmInfo?: { adiff?: { actions?: AdiffAction[] }; metadata?: { changeset?: { comments?: any[] } } }
  selected?: AdiffAction | null
  setHighlight: (type: string, id: number, isHighlighted: boolean) => void
  zoomToAndSelect: (type: string, id: number) => void
}

export function ReviewColumn({
  changesetId,
  currentChangeset,
  camera,
  userDetails,
  whosThat = [],
  bindingsState,
  exclusiveKeyToggle,
  osmInfo,
  selected,
  setHighlight,
  zoomToAndSelect,
}: ReviewColumnProps) {
  const [expanded, setExpanded] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const dragStartY = useRef<number | null>(null)
  const dragged = useRef(false)
  const properties: Record<string, any> = currentChangeset.properties ?? {}
  const discussions = osmInfo?.metadata?.changeset?.comments || []
  const changesetCount =
    (properties.create ?? 0) + (properties.modify ?? 0) + (properties.delete ?? 0)
  const changesActive = Boolean(bindingsState[CHANGESET_DETAILS_DETAILS.label])
  const discussionActive = Boolean(bindingsState[CHANGESET_DETAILS_DISCUSSIONS.label])

  function selectPanel(label: string) {
    const turningOn = !bindingsState[label]
    exclusiveKeyToggle(label)
    if (turningOn) setExpanded(true)
  }

  const onSelectPanel = useEffectEvent((label: string) => {
    selectPanel(label)
  })

  useEffect(function bindReviewColumnShortcuts() {
    for (const tab of COLUMN_TABS) {
      Mousetrap.bind(tab.bindings, () => onSelectPanel(tab.key))
    }
    Mousetrap.bind(CHANGESET_DETAILS_USER.bindings, () => {
      setUserOpen((open) => !open)
      setExpanded(true)
    })
    return function unbindReviewColumnShortcuts() {
      for (const tab of COLUMN_TABS) {
        for (const binding of tab.bindings) {
          Mousetrap.unbind(binding)
        }
      }
      for (const binding of CHANGESET_DETAILS_USER.bindings) {
        Mousetrap.unbind(binding)
      }
    }
  }, [])

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
        'min-[56rem]:relative min-[56rem]:inset-auto min-[56rem]:h-full min-[56rem]:w-96 min-[56rem]:shrink-0 min-[56rem]:rounded-lg min-[56rem]:shadow-sm min-[56rem]:ring-1 min-[56rem]:ring-zinc-950/5',
      )}
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-label={expanded ? 'Collapse review' : 'Expand review'}
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerUp}
        onClick={onHandleClick}
        className="flex min-h-11 w-full cursor-pointer items-center justify-center touch-manipulation select-none min-[56rem]:hidden"
      >
        <span className="h-1 w-10 rounded-full bg-zinc-300" />
      </button>

      <DetailsHeader
        changesetId={changesetId}
        currentChangeset={currentChangeset}
        camera={camera}
        userDetails={userDetails}
        whosThat={whosThat}
        userOpen={userOpen}
        onUserOpenChange={setUserOpen}
      />

      <div
        className={clsx(
          'min-h-0 flex-1 flex-col overflow-hidden',
          expanded ? 'flex' : 'hidden',
          'min-[56rem]:flex',
        )}
      >
        <nav aria-label="Review panels" className="flex shrink-0 gap-1 border-b border-zinc-950/10 px-2 py-1">
          <ReviewTab
            current={changesActive}
            title={`Changes (${CHANGESET_DETAILS_DETAILS.bindings[0]})`}
            onClick={() => selectPanel(CHANGESET_DETAILS_DETAILS.label)}
          >
            Changes {changesetCount > 0 ? <Badge>{changesetCount}</Badge> : null}
          </ReviewTab>
          <ReviewTab
            current={discussionActive}
            title={`Discussion (${CHANGESET_DETAILS_DISCUSSIONS.bindings[0]})`}
            onClick={() => selectPanel(CHANGESET_DETAILS_DISCUSSIONS.label)}
          >
            Discussion{' '}
            {discussions.length > 0 ? (
              <Badge aria-label={`${discussions.length} comments`} className="flex flex-none items-center gap-1">
                <ChatBubbleLeftIcon className="size-4" /> {discussions.length}
              </Badge>
            ) : (
              <ChatBubbleLeftIcon className="size-4 text-zinc-300" aria-label="No comments" />
            )}
          </ReviewTab>
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {changesActive && (
            <DetailsChanges
              adiff={osmInfo?.adiff}
              features={properties.features ?? []}
              reviewedFeatures={properties.reviewed_features ?? []}
              reasons={properties.reasons ?? []}
              selected={selected}
              setHighlight={setHighlight}
              zoomToAndSelect={zoomToAndSelect}
            />
          )}
          {discussionActive && (
            <Discussions
              changesetAuthor={properties.user ?? ''}
              discussions={discussions}
              changesetIsHarmful={Boolean(properties.harmful)}
              changesetId={changesetId}
            />
          )}
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
    <Headless.Button
      type="button"
      title={title}
      aria-pressed={current}
      data-current={current ? 'true' : undefined}
      onClick={onClick}
      className={clsx(
        'relative flex min-h-11 cursor-pointer items-center gap-2 rounded-lg p-2 text-left text-sm/5 font-medium text-zinc-950 touch-manipulation select-none',
        'focus:not-data-focus:outline-hidden data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-blue-500',
        'active:bg-zinc-950/5',
        current && 'bg-zinc-950/5',
      )}
    >
      {children}
      {current ? <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-zinc-950" /> : null}
    </Headless.Button>
  )
}
