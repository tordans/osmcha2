import { useHotkeys } from '@tanstack/react-hotkeys'
import clsx from 'clsx'
import React, { useRef, useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import {
  CHANGESET_DETAILS_DETAILS,
  CHANGESET_DETAILS_DISCUSSIONS,
  CHANGESET_DETAILS_MAP,
} from '../../config/bindings.ts'
import { useAuth } from '../../hooks/useAuth.ts'
import { paneCardClassName, paneCardClipClassName } from '../../layout/paneCard.ts'
import { PaneResizeHandle } from '../../layout/PaneResizeHandle.tsx'
import { REVIEW_MAX, REVIEW_MIN, resizeSidePane } from '../../layout/paneWidths.ts'
import { useDisplayedPaneWidths } from '../../layout/usePaneLayout.ts'
import type { NoteTarget } from '../../notes/discussionNotes.ts'
import { useChangesetMap } from '../../query/hooks/useChangesetMap.ts'
import { useChangesetMapper } from '../../query/hooks/useChangesetMapper.ts'
import type { RefParam } from '../../routing/refParam.ts'
import { getListPaneOpen } from '../../stores/list-pane-store.ts'
import { useMapLoaded } from '../../stores/map-loaded-store.ts'
import {
  getListWidth,
  getPaneLayoutActions,
  getReviewWidth,
  usePaneLayoutActions,
} from '../../stores/pane-layout-store.ts'
import type { ChangesetAdiffViewer } from '../../views/changesetAdiffViewer.ts'
import { flyMapToAdiffElement } from '../../views/changesetCamera.ts'
import { setSelectedFeatureState } from '../../views/changesetFeatureState.ts'
import type { WorkArea } from '../../views/changesetWorkAreas.ts'
import { useActiveWorkArea, useJumpToWorkArea } from '../../views/useWorkAreaMap.ts'
import { DebugDataHelper } from '../debug/DebugDataHelper.tsx'
import { buildElementChanges, type AdiffAction } from './changesetElements.ts'
import { exclusiveKeyToggleState } from './exclusiveKeyToggle.ts'
import { MapOptions } from './map_options.tsx'
import { refDeepLinkKey, refParamFromElement, refsEqual } from './refSelection.ts'
import { ReviewColumn } from './ReviewColumn.tsx'
import { WorkAreaBar } from './WorkAreaBar.tsx'
import { groupChangesByWorkArea } from './workAreaChanges.ts'

type ChangesetProps = {
  changesetId: number | null
  currentChangeset: any
  viewer: ChangesetAdiffViewer | null
  workAreas: WorkArea[]
  selected: AdiffAction | null
  selectedRef: RefParam | null
  selectRef: (ref: RefParam | null) => void
  revealRef: (target: NoteTarget) => void
  pinSearch?: string
  inAppDeepLinkKey: string | null
  revealNonce: number
  revealTarget: NoteTarget | null
  children: React.ReactNode
}

const columnToggleOptions = [CHANGESET_DETAILS_DETAILS, CHANGESET_DETAILS_DISCUSSIONS]

/**
 * Review workspace: map pane (children) plus the review column / bottom sheet.
 * Map options stay on the map; selected features highlight the Changes row.
 */
function Changeset({
  changesetId,
  currentChangeset,
  viewer,
  workAreas,
  selected,
  selectedRef,
  selectRef,
  revealRef,
  pinSearch,
  inAppDeepLinkKey,
  revealNonce,
  revealTarget,
  children,
}: ChangesetProps) {
  const { token } = useAuth()
  const { available, displayed } = useDisplayedPaneWidths(true)
  const { resetReviewWidth } = usePaneLayoutActions()
  const { data: osmInfo } = useChangesetMap(changesetId)
  const { userDetails, whosThat } = useChangesetMapper(
    currentChangeset?.properties?.uid,
    Boolean(token),
  )
  const ready = Boolean(changesetId && currentChangeset)
  const mapOptionsButtonRef = useRef<HTMLButtonElement>(null)
  const { mainMap } = useMap()
  const mapLoaded = useMapLoaded()
  const activeWorkArea = useActiveWorkArea(workAreas)
  const jumpToWorkArea = useJumpToWorkArea(workAreas)
  const showWorkAreas = ready && workAreas.length > 1
  const [appliedDeepLinkKey, setAppliedDeepLinkKey] = useState<string | null>(null)
  const [deepLinkReveal, setDeepLinkReveal] = useState<RefParam | null>(null)
  const [deepLinkEpoch, setDeepLinkEpoch] = useState(0)

  const [bindingsState, setBindingsState] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const opt of columnToggleOptions) {
      initial[opt.label] = opt === CHANGESET_DETAILS_DETAILS
    }
    return initial
  })

  const urlDeepLinkKey =
    changesetId != null ? refDeepLinkKey(changesetId, selectedRef, pinSearch) : null
  const selectedObjectKey = selectedRef ? `${selectedRef.type}/${selectedRef.id}` : null
  const [revealedSelectionKey, setRevealedSelectionKey] = useState<string | null>(null)
  if (selectedObjectKey != null && selectedObjectKey !== revealedSelectionKey) {
    setRevealedSelectionKey(selectedObjectKey)
    if (!bindingsState[CHANGESET_DETAILS_DETAILS.label]) {
      setBindingsState({
        [CHANGESET_DETAILS_DETAILS.label]: true,
        [CHANGESET_DETAILS_DISCUSSIONS.label]: false,
      })
    }
  }
  if (selectedObjectKey == null && revealedSelectionKey != null) {
    setRevealedSelectionKey(null)
  }
  const revealPending = revealTarget != null && !refsEqual(revealTarget.ref, selectedRef)
  const applyKey =
    revealNonce > 0 && revealTarget && !revealPending
      ? `${changesetId}:reveal:${revealNonce}`
      : urlDeepLinkKey
  if (!revealPending) {
    if (!applyKey) {
      if (appliedDeepLinkKey != null) setAppliedDeepLinkKey(null)
    } else if (inAppDeepLinkKey !== urlDeepLinkKey && appliedDeepLinkKey !== applyKey) {
      setAppliedDeepLinkKey(applyKey)
      setDeepLinkEpoch((epoch) => epoch + 1)
      setBindingsState({
        [CHANGESET_DETAILS_DETAILS.label]: true,
        [CHANGESET_DETAILS_DISCUSSIONS.label]: false,
      })
      setDeepLinkReveal(revealTarget?.ref ?? selectedRef)
    }
  }

  function exclusiveKeyToggle(label: string) {
    setBindingsState((prev) => exclusiveKeyToggleState(columnToggleOptions, prev, label))
  }

  useHotkeys(
    CHANGESET_DETAILS_MAP.hotkeys.map((hotkey) => ({
      hotkey,
      callback: () => {
        mapOptionsButtonRef.current?.click()
      },
    })),
  )

  function zoomToAndSelect(type: string, id: number, key?: string) {
    const nextRef = refParamFromElement(type, id, key)
    if (nextRef) selectRef(nextRef)
    if (!mainMap || !mapLoaded || !viewer) return
    const map = mainMap.getMap()
    setSelectedFeatureState(map, viewer.geojson, type, id)
    flyMapToAdiffElement(map, viewer, type, id, null, { staged: true })
  }

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-col min-[56rem]:flex-row">
      <div className={clsx('relative min-h-0 min-w-0 flex-1', paneCardClassName)}>
        <div className={clsx('h-full', paneCardClipClassName)}>{children}</div>
        {/* Narrow: below the List button, left of the map buttons. Wide: top center. */}
        {showWorkAreas ? (
          <div className="pointer-events-none absolute top-[calc(max(0.75rem,env(safe-area-inset-top))+3.25rem)] right-16 left-[max(0.75rem,env(safe-area-inset-left))] z-10 flex min-[56rem]:top-[max(0.75rem,env(safe-area-inset-top))] min-[56rem]:right-[max(0.75rem,env(safe-area-inset-right))] min-[56rem]:left-44 min-[56rem]:justify-center">
            <WorkAreaBar
              groups={groupChangesByWorkArea(
                buildElementChanges(osmInfo?.adiff?.actions ?? []),
                workAreas,
              )}
              active={activeWorkArea}
              onJump={jumpToWorkArea}
            />
          </div>
        ) : null}
        <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] z-10 flex flex-col-reverse items-end gap-2 min-[56rem]:top-auto min-[56rem]:bottom-[max(0.75rem,env(safe-area-inset-bottom))] min-[56rem]:flex-col">
          {ready && (
            <MapOptions
              ref={mapOptionsButtonRef}
              imageryUsed={
                typeof currentChangeset?.properties?.imagery_used === 'string'
                  ? currentChangeset.properties.imagery_used
                  : null
              }
            />
          )}
        </div>
      </div>
      {ready && changesetId && (
        <>
          <PaneResizeHandle
            aria-label="Resize review pane"
            value={displayed.review}
            min={REVIEW_MIN}
            max={REVIEW_MAX}
            onDragDelta={(delta) => {
              const listWidth = getListWidth()
              const reviewWidth = getReviewWidth()
              getPaneLayoutActions().setReviewWidth(
                resizeSidePane({
                  side: 'review',
                  delta: -delta,
                  available,
                  list: listWidth,
                  review: reviewWidth,
                  hasReview: true,
                  hasList: getListPaneOpen(),
                }),
              )
            }}
            onReset={resetReviewWidth}
          />
          <ReviewColumn
            changesetId={changesetId}
            currentChangeset={currentChangeset}
            userDetails={userDetails}
            whosThat={whosThat}
            bindingsState={bindingsState}
            exclusiveKeyToggle={exclusiveKeyToggle}
            osmInfo={osmInfo}
            workAreas={workAreas}
            activeWorkArea={activeWorkArea}
            jumpToWorkArea={jumpToWorkArea}
            selected={selected}
            selectedRef={selectedRef}
            selectRef={selectRef}
            revealRef={revealRef}
            deepLinkReveal={deepLinkReveal}
            deepLinkEpoch={deepLinkEpoch}
            zoomToAndSelect={zoomToAndSelect}
          />
        </>
      )}
      <DebugDataHelper changesetId={changesetId} selected={selected} />
    </div>
  )
}

export { Changeset }
