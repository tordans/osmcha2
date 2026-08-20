import { useHotkeys } from '@tanstack/react-hotkeys'
import bbox from '@turf/bbox'
import React, { useRef, useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import {
  CHANGESET_DETAILS_DETAILS,
  CHANGESET_DETAILS_DISCUSSIONS,
  CHANGESET_DETAILS_MAP,
} from '../../config/bindings.ts'
import { useAuth } from '../../hooks/useAuth.ts'
import { PaneResizeHandle } from '../../layout/PaneResizeHandle.tsx'
import { REVIEW_MAX, REVIEW_MIN, resizeSidePane } from '../../layout/paneWidths.ts'
import { useDisplayedPaneWidths } from '../../layout/usePaneLayout.ts'
import { useChangesetMap } from '../../query/hooks/useChangesetMap.ts'
import { useChangesetMapper } from '../../query/hooks/useChangesetMapper.ts'
import { useMapLoaded } from '../../stores/map-loaded-store.ts'
import { usePaneLayoutStore } from '../../stores/paneLayoutStore.ts'
import type { ChangesetAdiffViewer } from '../../views/changesetAdiffViewer.ts'
import {
  setHighlightedFeatureState,
  setSelectedFeatureState,
  type ChangesetGeoJSON,
} from '../../views/changesetFeatureState.ts'
import { DebugDataHelper } from '../debug/DebugDataHelper.tsx'
import { exclusiveKeyToggleState } from './exclusiveKeyToggle.ts'
import { MapOptions } from './map_options.tsx'
import { ReviewColumn } from './ReviewColumn.tsx'

type ChangesetProps = {
  changesetId: number | null
  currentChangeset: any
  showElements: Array<string>
  showActions: Array<string>
  setShowElements: (elements: Array<string>) => any
  setShowActions: (actions: Array<string>) => any
  viewer: ChangesetAdiffViewer | null
  selected: any
  setSelected: (selected: any) => void
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
  showElements,
  showActions,
  setShowElements,
  setShowActions,
  viewer,
  selected,
  setSelected,
  children,
}: ChangesetProps) {
  const { token } = useAuth()
  const { available, displayed } = useDisplayedPaneWidths(true)
  const resetReviewWidth = usePaneLayoutStore((state) => state.resetReviewWidth)
  const { data: osmInfo } = useChangesetMap(changesetId)
  const { userDetails, whosThat } = useChangesetMapper(
    currentChangeset?.properties?.uid,
    Boolean(token),
  )
  const ready = Boolean(changesetId && currentChangeset)
  const mapOptionsButtonRef = useRef<HTMLButtonElement>(null)
  const { mainMap } = useMap()
  const mapLoaded = useMapLoaded()

  const [bindingsState, setBindingsState] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const opt of columnToggleOptions) {
      initial[opt.label] = opt === CHANGESET_DETAILS_DETAILS
    }
    return initial
  })

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

  function setHighlight(type: string, id: number, isHighlighted: boolean) {
    if (!mainMap || !mapLoaded || !viewer) return
    setHighlightedFeatureState(
      mainMap.getMap(),
      viewer.geojson as ChangesetGeoJSON,
      type,
      id,
      isHighlighted,
    )
  }

  function zoomToAndSelect(type: string, id: number) {
    if (!mainMap || !mapLoaded || !viewer) return
    const map = mainMap.getMap()

    const features = viewer.geojson.features.filter(
      (feature) => feature.properties?.type === type && feature.properties?.id === id,
    )

    let bounds = bbox({ type: 'FeatureCollection', features })
    if (bounds.length === 6) {
      bounds = [bounds[0], bounds[1], bounds[3], bounds[4]]
    }
    const nextCamera = map.cameraForBounds(bounds as [number, number, number, number], {
      padding: 50,
      maxZoom: 18,
    })
    if (nextCamera) {
      map.jumpTo(nextCamera)
    }

    setSelectedFeatureState(map, viewer.geojson as ChangesetGeoJSON, type, id)

    const action = viewer.adiff.actions.find(
      (item: { new?: { type?: string; id?: number }; old?: { type?: string; id?: number } }) => {
        const element = item.new ?? item.old
        return element?.type === type && element?.id === id
      },
    )

    setSelected(action)
  }

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-col min-[56rem]:flex-row">
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden min-[56rem]:rounded-lg min-[56rem]:ring-1 min-[56rem]:ring-zinc-950/5">
        {children}
        <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] z-10 flex flex-col-reverse items-end gap-2 min-[56rem]:top-auto min-[56rem]:bottom-[max(0.75rem,env(safe-area-inset-bottom))] min-[56rem]:flex-col">
          {ready && (
            <MapOptions
              ref={mapOptionsButtonRef}
              imageryUsed={
                typeof currentChangeset?.properties?.imagery_used === 'string'
                  ? currentChangeset.properties.imagery_used
                  : null
              }
              showElements={showElements}
              showActions={showActions}
              setShowElements={setShowElements}
              setShowActions={setShowActions}
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
              const { listWidth, reviewWidth, setReviewWidth } = usePaneLayoutStore.getState()
              setReviewWidth(
                resizeSidePane({
                  side: 'review',
                  delta: -delta,
                  available,
                  list: listWidth,
                  review: reviewWidth,
                  hasReview: true,
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
            selected={selected}
            setHighlight={setHighlight}
            zoomToAndSelect={zoomToAndSelect}
          />
        </>
      )}
      <DebugDataHelper changesetId={changesetId} selected={selected} />
    </div>
  )
}

export { Changeset }
