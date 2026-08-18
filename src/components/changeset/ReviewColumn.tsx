import {
  ArrowsPointingOutIcon,
  ChatBubbleLeftIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  HashtagIcon,
  PlusIcon,
  UserIcon,
} from '@heroicons/react/20/solid'
import clsx from 'clsx'
import Mousetrap from 'mousetrap'
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import {
  CHANGESET_DETAILS_DETAILS,
  CHANGESET_DETAILS_DISCUSSIONS,
  CHANGESET_DETAILS_GEOMETRY_CHANGES,
  CHANGESET_DETAILS_OTHER_FEATURES,
  CHANGESET_DETAILS_SUSPICIOUS,
  CHANGESET_DETAILS_TAGS,
  CHANGESET_DETAILS_USER,
} from '../../config/bindings.ts'
import { CreateDeleteModify } from '../create_delete_modify.tsx'
import { Details } from './details.tsx'
import { DetailsHeader, type ReviewChangeset, type ReviewUserDetails } from './DetailsHeader.tsx'
import { Discussions } from './discussions.tsx'
import { Features } from './features.tsx'
import { GeometryChanges } from './geometry_changes.tsx'
import { OtherFeatures } from './other_features.tsx'
import { TagChanges } from './tag_changes.tsx'
import { User } from './user.tsx'
import type { ReviewCamera } from './openInUrls.ts'

const COLUMN_TABS = [
  {
    key: CHANGESET_DETAILS_DETAILS.label,
    label: 'Details',
    bindings: CHANGESET_DETAILS_DETAILS.bindings,
    icon: EyeIcon,
  },
  {
    key: CHANGESET_DETAILS_SUSPICIOUS.label,
    label: 'Flagged features',
    bindings: CHANGESET_DETAILS_SUSPICIOUS.bindings,
    icon: ExclamationTriangleIcon,
  },
  {
    key: CHANGESET_DETAILS_TAGS.label,
    label: 'Tag changes',
    bindings: CHANGESET_DETAILS_TAGS.bindings,
    icon: HashtagIcon,
  },
  {
    key: CHANGESET_DETAILS_GEOMETRY_CHANGES.label,
    label: 'Geometry changes',
    bindings: CHANGESET_DETAILS_GEOMETRY_CHANGES.bindings,
    icon: ArrowsPointingOutIcon,
  },
  {
    key: CHANGESET_DETAILS_OTHER_FEATURES.label,
    label: 'Other features',
    bindings: CHANGESET_DETAILS_OTHER_FEATURES.bindings,
    icon: PlusIcon,
  },
  {
    key: CHANGESET_DETAILS_DISCUSSIONS.label,
    label: 'Discussion',
    bindings: CHANGESET_DETAILS_DISCUSSIONS.bindings,
    icon: ChatBubbleLeftIcon,
  },
  {
    key: CHANGESET_DETAILS_USER.label,
    label: 'User',
    bindings: CHANGESET_DETAILS_USER.bindings,
    icon: UserIcon,
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
  osmInfo?: { adiff?: any; metadata?: { changeset?: { comments?: any[] } } }
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
  setHighlight,
  zoomToAndSelect,
}: ReviewColumnProps) {
  const [expanded, setExpanded] = useState(false)
  const dragStartY = useRef<number | null>(null)
  const dragged = useRef(false)
  const properties: Record<string, any> = currentChangeset.properties ?? {}
  const features = properties.features || []
  const discussions = osmInfo?.metadata?.changeset?.comments || []

  const selectPanel = useCallback(
    (label: string) => {
      exclusiveKeyToggle(label)
      if (label !== CHANGESET_DETAILS_DETAILS.label) {
        setExpanded(true)
      }
    },
    [exclusiveKeyToggle],
  )

  useEffect(() => {
    for (const tab of COLUMN_TABS) {
      Mousetrap.bind(tab.bindings, () => selectPanel(tab.key))
    }
    return () => {
      for (const tab of COLUMN_TABS) {
        for (const binding of tab.bindings) {
          Mousetrap.unbind(binding)
        }
      }
    }
  }, [selectPanel])

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
      />

      <div
        className={clsx(
          'min-h-0 flex-1 flex-col overflow-hidden',
          expanded ? 'flex' : 'hidden',
          'min-[56rem]:flex',
        )}
      >
        <nav
          aria-label="Review panels"
          className="flex shrink-0 gap-0.5 overflow-x-auto border-b border-zinc-950/10 px-1 py-1"
        >
          {COLUMN_TABS.map((tab) => {
            const Icon = tab.icon
            const active = Boolean(bindingsState[tab.key])
            const dimmed =
              (tab.key === CHANGESET_DETAILS_SUSPICIOUS.label && features.length === 0) ||
              (tab.key === CHANGESET_DETAILS_DISCUSSIONS.label && discussions.length === 0)

            return (
              <button
                key={tab.key}
                type="button"
                aria-label={tab.label}
                aria-pressed={active}
                title={`${tab.label} (${tab.bindings[0]})`}
                onClick={() => selectPanel(tab.key)}
                className={clsx(
                  'inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg touch-manipulation select-none',
                  active ? 'bg-zinc-950/5 text-zinc-950' : 'text-zinc-500 active:bg-zinc-950/5',
                  dimmed && !active && 'text-zinc-300',
                )}
              >
                <Icon className="size-5" />
              </button>
            )
          })}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {bindingsState[CHANGESET_DETAILS_DETAILS.label] && (
            <div className="px-3 py-2">
              <CreateDeleteModify
                showZero
                className="mb-2"
                create={properties.create}
                modify={properties.modify}
                delete={properties.delete}
              />
              <Details changesetId={changesetId} properties={properties} />
            </div>
          )}
          {bindingsState[CHANGESET_DETAILS_SUSPICIOUS.label] && (
            <Features
              changesetId={changesetId}
              properties={{
                features: properties.features ?? [],
                reviewed_features: properties.reviewed_features ?? [],
                reasons: properties.reasons ?? [],
              }}
              setHighlight={setHighlight}
              zoomToAndSelect={zoomToAndSelect}
            />
          )}
          {bindingsState[CHANGESET_DETAILS_TAGS.label] && (
            <TagChanges
              changesetId={changesetId}
              adiff={osmInfo?.adiff}
              setHighlight={setHighlight}
              zoomToAndSelect={zoomToAndSelect}
            />
          )}
          {bindingsState[CHANGESET_DETAILS_GEOMETRY_CHANGES.label] && (
            <GeometryChanges
              changesetId={changesetId}
              adiff={osmInfo?.adiff}
              setHighlight={setHighlight}
              zoomToAndSelect={zoomToAndSelect}
            />
          )}
          {bindingsState[CHANGESET_DETAILS_OTHER_FEATURES.label] && (
            <OtherFeatures
              changesetId={changesetId}
              adiff={osmInfo?.adiff}
              setHighlight={setHighlight}
              zoomToAndSelect={zoomToAndSelect}
            />
          )}
          {bindingsState[CHANGESET_DETAILS_DISCUSSIONS.label] && (
            <Discussions
              changesetAuthor={properties.user ?? ''}
              discussions={discussions}
              changesetIsHarmful={Boolean(properties.harmful)}
              changesetId={changesetId}
            />
          )}
          {bindingsState[CHANGESET_DETAILS_USER.label] && (
            <User
              userDetails={{
                uid: properties.uid,
                name: properties.user,
                ...userDetails,
              }}
              whosThat={whosThat}
              changesetUsername
            />
          )}
        </div>
      </div>
    </section>
  )
}
