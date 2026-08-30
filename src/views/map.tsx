import { useThrottledCallback } from '@tanstack/react-pacer'
import { getRouteApi } from '@tanstack/react-router'
import type { Map as MaplibreMap, MapLibreEvent, StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import {
  AttributionControl,
  Map,
  Source,
  Layer,
  useMap,
  type LayerProps,
  type MapLayerMouseEvent,
  type ViewStateChangeEvent,
} from 'react-map-gl/maplibre'
import { toast } from 'sonner'
import { ACTION } from '../components/changeset/actionColors.ts'
import { resolveBasemapStyle } from '../components/changeset/basemapStyles.ts'
import type { AdiffAction } from '../components/changeset/changesetElements.ts'
import { InspectKindSwatch } from '../components/changeset/InspectKindSwatch.tsx'
import { matchImageryUsedStyleId } from '../components/changeset/matchImageryUsed.ts'
import {
  actionMatchingRef,
  refDeepLinkKey,
  refParamFromElement,
  type RefParam,
} from '../components/changeset/refSelection.ts'
import { Loading } from '../components/loading.tsx'
import { SignIn } from '../components/sign_in.tsx'
import { flyoutSurfaceClassName } from '../components/ui/flyout.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { useNotesUserKey } from '../notes/useNotesUserKey.ts'
import { useChangesetMap } from '../query/hooks/useChangesetMap.ts'
import { parseLayersParam } from '../routing/layersParam.ts'
import { parseMapParam, serializeMapParam } from '../routing/mapParam.ts'
import { parsePinParam } from '../routing/pinParam.ts'
import { parseRefParam } from '../routing/refParam.ts'
import { useChangesetHover, useChangesetHoverActions } from '../stores/changeset-hover-store.ts'
import {
  getChangesetNotesActions,
  getPinPlacement,
  usePinPlacement,
  useSeenMap,
} from '../stores/changeset-notes-store.ts'
import { useMapActions, useMapLoaded } from '../stores/map-loaded-store.ts'
import { useMapStore } from '../stores/mapStore.ts'
import {
  CHANGESET_MAP_ID,
  CHANGESET_SOURCE_ID,
  splitChangesetFeatureLayers,
  splitChangesetLayers,
  type ChangesetAdiffViewer,
} from './changesetAdiffViewer.ts'
import {
  changesetCameraIntent,
  changesetFitOptions,
  jumpMapToAdiffElement,
  jumpMapToChangesetBounds,
  jumpMapToPin,
} from './changesetCamera.ts'
import { CHANGESET_EMPHASIS_LAYERS } from './changesetEmphasisLayers.ts'
import {
  clearSelectedFeatureState,
  setSelectedFeatureState,
  syncHighlightedFeatureState,
  type ChangesetGeoJSON,
} from './changesetFeatureState.ts'
import { pickChangesetActionFromClick } from './changesetMapClick.ts'
import { ChangesetMapUnavailable } from './ChangesetMapUnavailable.tsx'
import {
  applySeenMapStyle,
  changesetFeaturePassesReviewFilter,
  syncSeenFeatureState,
} from './changesetSeenStyle.ts'
import { changesetViewBounds } from './changesetViewBounds.ts'
import {
  clearMainMapDebugExposure,
  exposeMainMapForDebugging,
} from './exposeMainMapForDebugging.ts'
import { ChangesetPinMarkers, PinPlacementOverlay } from './PinPlacementOverlay.tsx'
import {
  changesetClickableLayerIds,
  changesetHoverFromFeatures,
  changesetInspectLayerIds,
  cursorForMapHover,
  inspectHoverFromFeatures,
  inspectFlyoutTags,
  spyglassEnabledAtZoom,
  type InspectHover,
  type InspectHoverItem,
} from './spyglassOverlay.ts'
import { SpyglassOverlay } from './SpyglassOverlay.tsx'
import { shouldIgnoreMapClick } from './suppressMapClick.ts'

const changesetRouteApi = getRouteApi('/changesets/$id')

function serializeMapCamera(map: MaplibreMap) {
  const center = map.getCenter()
  return serializeMapParam({
    zoom: map.getZoom(),
    lat: center.lat,
    lng: center.lng,
  })
}

function runWhileApplyingCamera(flag: { current: boolean }, apply: () => void) {
  flag.current = true
  try {
    apply()
  } finally {
    flag.current = false
  }
}

function waitForMapStoreHydration(): Promise<void> {
  if (useMapStore.persist.hasHydrated()) return Promise.resolve()
  return new Promise((resolve) => {
    const unsub = useMapStore.persist.onFinishHydration(() => {
      unsub()
      resolve()
    })
  })
}

/**
 * MapLibre `compact` is the ⓘ toggle, not "start closed". On add it still sets
 * `.maplibregl-compact-show` (expanded); it only collapses later on pan. Render this
 * after `<AttributionControl>` so this effect runs after the control is added.
 */
function CollapseCompactAttributionOnMount() {
  const { mainMap } = useMap()

  useEffect(
    function collapseCompactAttribution() {
      mainMap
        ?.getMap()
        .getContainer()
        .querySelector('.maplibregl-ctrl-attrib')
        ?.classList.remove('maplibregl-compact-show')
    },
    [mainMap],
  )

  return null
}

interface CMapProps {
  changesetId: number | null
  imageryUsed?: string | null
  viewer: ChangesetAdiffViewer | null
  selectRef: (ref: RefParam | null) => void
  inAppDeepLinkKey: string | null
}

function CMap({ changesetId, imageryUsed, viewer, selectRef, inAppDeepLinkKey }: CMapProps) {
  const { token } = useAuth()
  const {
    map: mapSearch,
    ref: refSearch,
    pin: pinSearch,
    layers: layersSearch,
  } = changesetRouteApi.useSearch()
  const navigate = changesetRouteApi.useNavigate()
  const zoomedDeepLinkKeyRef = useRef<string | null>(null)
  const styleId = useMapStore((state) => state.style)
  const changesetQuery = useChangesetMap(changesetId)
  const { mainMap } = useMap()
  const mapLoaded = useMapLoaded()
  const { markMapLoaded, resetMapLoaded } = useMapActions()
  const containerRef = useRef<HTMLDivElement>(null)
  const applyingCameraRef = useRef(false)
  const urlWritesEnabledRef = useRef(false)
  const lastClickFeatureIdRef = useRef<string | number | null>(null)
  const matchedImageryUsedRef = useRef<string | null | undefined>(undefined)
  const emptyAdiffWarnedRef = useRef(false)
  const [mapStyle, setMapStyle] = useState<StyleSpecification | null>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [cursor, setCursor] = useState('default')
  const [styleEpoch, setStyleEpoch] = useState(0)
  const [inspectHover, setInspectHover] = useState<InspectHover | null>(null)
  const [inspectPoint, setInspectPoint] = useState<{ x: number; y: number } | null>(null)
  const pinPlacement = usePinPlacement()
  const mapLayers = parseLayersParam(layersSearch)
  const spyglassEnabled = mapLayers.spyglass
  const userKey = useNotesUserKey()
  const seenMap = useSeenMap(userKey, changesetId ?? 0)
  const hover = useChangesetHover()
  const { setHover, requestListScroll } = useChangesetHoverActions()

  const replaceMapSearch = useEffectEvent((next: string) => {
    if (!urlWritesEnabledRef.current) return
    if (next === mapSearch) return
    void navigate({
      search: (prev) => ({ ...prev, map: next }),
      replace: true,
    })
  })

  const writeMapToUrl = useThrottledCallback(
    (next: string) => {
      replaceMapSearch(next)
    },
    { wait: 250 },
  )

  useEffect(
    function resetMapLoadedOnUnmount() {
      return function resetMapLoadedWhenMapUnmounts() {
        resetMapLoaded()
        clearMainMapDebugExposure()
        urlWritesEnabledRef.current = false
        setHover(null)
      }
    },
    [resetMapLoaded, setHover],
  )

  useEffect(function observeMapContainerSize() {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      const width = container.clientWidth
      const height = container.clientHeight
      setContainerSize((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height },
      )
    })
    observer.observe(container)
    setContainerSize({ width: container.clientWidth, height: container.clientHeight })
    return function disconnectMapContainerObserver() {
      observer.disconnect()
    }
  }, [])

  useEffect(
    function resolveChangesetBasemap() {
      let cancelled = false

      async function loadBasemap() {
        await waitForMapStoreHydration()
        if (cancelled) return

        if (matchedImageryUsedRef.current !== imageryUsed) {
          matchedImageryUsedRef.current = imageryUsed
          const matchedStyleId = matchImageryUsedStyleId(imageryUsed)
          if (matchedStyleId && matchedStyleId !== useMapStore.getState().style) {
            useMapStore.getState().setStyle(matchedStyleId)
            return
          }
        }

        const spec = await resolveBasemapStyle(useMapStore.getState().style)
        if (!cancelled) setMapStyle(spec)
      }

      void loadBasemap()
      return function cancelResolveChangesetBasemap() {
        cancelled = true
      }
    },
    [styleId, imageryUsed],
  )

  useEffect(
    function warnEmptyAdiff() {
      if (!viewer || emptyAdiffWarnedRef.current) return
      if (viewer.adiff.actions.length === 0) {
        emptyAdiffWarnedRef.current = true
        toast.error('Augmented diff is empty', {
          description: 'No elements to show',
        })
      }
    },
    [viewer],
  )

  useEffect(
    function applySearchCamera() {
      if (!mapLoaded) return
      const map = mainMap?.getMap()
      if (!map) return

      const intent = changesetCameraIntent(mapSearch)
      if (intent.type !== 'restore') return
      if (serializeMapCamera(map) === mapSearch) return

      runWhileApplyingCamera(applyingCameraRef, () => {
        map.jumpTo({
          center: [intent.camera.lng, intent.camera.lat],
          zoom: intent.camera.zoom,
        })
      })
    },
    [mapLoaded, mainMap, mapSearch],
  )

  useEffect(
    function refitWhenContainerResizes() {
      if (!mapLoaded || !viewer) return
      const map = mainMap?.getMap()
      if (!map) return
      if (changesetCameraIntent(mapSearch).type !== 'fit') return

      const bounds = changesetViewBounds(viewer.geojson.features)
      if (!bounds) return

      runWhileApplyingCamera(applyingCameraRef, () => {
        map.resize()
        jumpMapToChangesetBounds(map, bounds)
      })
    },
    [mapLoaded, mainMap, viewer, mapSearch, containerSize.width, containerSize.height],
  )

  const applyFeatureStateFromRef = useEffectEvent((map: MaplibreMap) => {
    if (!viewer) return
    const parsed = parseRefParam(refSearch ?? '')
    const geojson = viewer.geojson as ChangesetGeoJSON
    const action = actionMatchingRef(viewer.adiff.actions as AdiffAction[], parsed)
    if (!parsed || !action) {
      clearSelectedFeatureState(map, geojson)
      return
    }
    setSelectedFeatureState(map, geojson, parsed.type, parsed.id)
  })

  const zoomOnceForDeepLink = useEffectEvent((map: MaplibreMap) => {
    if (!viewer || changesetId == null) return
    const parsed = parseRefParam(refSearch ?? '')
    const pin = parsePinParam(pinSearch ?? '')
    const key = refDeepLinkKey(changesetId, parsed, pinSearch)
    if (!key || (!parsed && !pin)) {
      zoomedDeepLinkKeyRef.current = null
      return
    }
    if (zoomedDeepLinkKeyRef.current === key) return
    if (inAppDeepLinkKey === key) {
      zoomedDeepLinkKeyRef.current = key
      return
    }
    if (!parsed) {
      if (!pin) {
        zoomedDeepLinkKeyRef.current = null
        return
      }
      zoomedDeepLinkKeyRef.current = key
      runWhileApplyingCamera(applyingCameraRef, () => {
        jumpMapToPin(map, pin)
      })
      return
    }
    const action = actionMatchingRef(viewer.adiff.actions as AdiffAction[], parsed)
    if (!action) return
    zoomedDeepLinkKeyRef.current = key
    runWhileApplyingCamera(applyingCameraRef, () => {
      jumpMapToAdiffElement(map, viewer, parsed.type, parsed.id, pin)
    })
  })

  useEffect(
    function syncSelectedFeatureStateFromRef() {
      if (!mapLoaded) return
      const map = mainMap?.getMap()
      if (!map) return
      applyFeatureStateFromRef(map)
    },
    [mapLoaded, mainMap, viewer, refSearch, styleEpoch],
  )

  const applyHighlightFromHover = useEffectEvent((map: MaplibreMap) => {
    if (!viewer) return
    syncHighlightedFeatureState(map, viewer.geojson as ChangesetGeoJSON, hover)
  })

  useEffect(
    function syncHighlightedFeatureStateFromHover() {
      if (!mapLoaded) return
      const map = mainMap?.getMap()
      if (!map) return
      applyHighlightFromHover(map)
    },
    [mapLoaded, mainMap, viewer, hover, styleEpoch],
  )

  const applySeenFromNotes = useEffectEvent((map: MaplibreMap) => {
    if (!viewer) return
    syncSeenFeatureState(map, viewer.geojson as ChangesetGeoJSON, seenMap)
  })

  useEffect(
    function syncSeenFeatureStateFromNotes() {
      if (!mapLoaded) return
      const map = mainMap?.getMap()
      if (!map) return
      applySeenFromNotes(map)
    },
    [mapLoaded, mainMap, viewer, seenMap, styleEpoch],
  )

  useEffect(
    function zoomOnceForDeepLinkRef() {
      if (!mapLoaded) return
      const map = mainMap?.getMap()
      if (!map) return
      zoomOnceForDeepLink(map)
    },
    [mapLoaded, mainMap, viewer, changesetId, refSearch, pinSearch, inAppDeepLinkKey, styleEpoch],
  )

  if (!token) {
    return <SignIn />
  }

  const parsedCamera = parseMapParam(mapSearch ?? '')
  const fitOptions = changesetFitOptions(containerSize.width, containerSize.height)
  const viewBounds = viewer ? changesetViewBounds(viewer.geojson.features) : null
  const layers = applySeenMapStyle(viewer?.layers() ?? [], {
    showSeen: mapLayers.showSeen,
    showUnseen: mapLayers.showUnseen,
    graySeen: true,
  })
  const emphasisLayers = applySeenMapStyle(CHANGESET_EMPHASIS_LAYERS, {
    showSeen: mapLayers.showSeen,
    showUnseen: mapLayers.showUnseen,
    graySeen: false,
  })
  const { overlayBg, featureLayers } = splitChangesetLayers(layers)
  const { caseLayers, coreLayers } = splitChangesetFeatureLayers(featureLayers)
  const firstFeatureLayerId = (caseLayers[0] ?? coreLayers[0])?.id
  const overlayState = spyglassEnabledAtZoom(spyglassEnabled, parsedCamera?.zoom ?? 0)
  const overlayActive = overlayState === 'active'
  const showActions = viewer?.options.showActions
  const showNoop = Array.isArray(showActions) && showActions.includes('noop')
  const clickableLayerIds = changesetClickableLayerIds(layers)
  const interactiveLayerIds = changesetInspectLayerIds(layers, { overlayActive, showNoop })
  const initialViewState = parsedCamera
    ? { longitude: parsedCamera.lng, latitude: parsedCamera.lat, zoom: parsedCamera.zoom }
    : viewBounds && fitOptions
      ? { bounds: viewBounds, fitBoundsOptions: fitOptions }
      : viewBounds
        ? { bounds: viewBounds, fitBoundsOptions: { padding: 16, maxZoom: 18 } }
        : { longitude: 0, latitude: 0, zoom: 1 }
  const canMountMap = Boolean(mapStyle && viewer)
  const showError = changesetQuery.isError && !changesetQuery.isFetching
  const showLoading =
    !showError && (!canMountMap || changesetQuery.isLoading || changesetQuery.isFetching)

  function isReviewVisible(feature: {
    source?: string
    properties?: { type?: string; id?: number } | null
  }) {
    return changesetFeaturePassesReviewFilter(
      feature,
      seenMap,
      mapLayers.showSeen,
      mapLayers.showUnseen,
    )
  }

  function handleLoad(event: MapLibreEvent) {
    const map = event.target
    map.touchZoomRotate.disableRotation()
    map.keyboard.disableRotation()
    exposeMainMapForDebugging(map)
    markMapLoaded()
    urlWritesEnabledRef.current = true
    setStyleEpoch((epoch) => epoch + 1)
  }

  function handleMoveEnd(event: ViewStateChangeEvent) {
    if (applyingCameraRef.current) return
    const { latitude, longitude, zoom } = event.viewState
    writeMapToUrl(serializeMapParam({ zoom, lat: latitude, lng: longitude }))
  }

  function handleClick(event: MapLayerMouseEvent) {
    if (!viewer) return
    if (shouldIgnoreMapClick()) return
    if (getPinPlacement()) {
      getChangesetNotesActions().placePin({
        lat: event.lngLat.lat,
        lng: event.lngLat.lng,
      })
      return
    }
    const map = event.target
    const { action, nextFeatureId } = pickChangesetActionFromClick({
      map,
      point: event.point,
      interactiveLayerIds: clickableLayerIds,
      actions: viewer.adiff.actions,
      previousFeatureId: lastClickFeatureIdRef.current,
      isFeatureVisible: isReviewVisible,
    })

    const geojson = viewer.geojson as ChangesetGeoJSON
    const hoverFeatures = event.features?.filter(isReviewVisible)

    if (nextFeatureId == null) {
      // Spyglass / noop are inspect-only. Do not treat them as an empty-map deselect.
      if (inspectHoverFromFeatures(hoverFeatures)) return
      lastClickFeatureIdRef.current = null
      selectRef(null)
      clearSelectedFeatureState(map, geojson)
      return
    }

    lastClickFeatureIdRef.current = nextFeatureId
    if (!action) return

    const element = action.new ?? action.old
    const nextRef = refParamFromElement(element?.type, element?.id)
    if (!nextRef) return
    requestListScroll({ type: nextRef.type, id: nextRef.id })
    selectRef(nextRef)
    setSelectedFeatureState(map, geojson, nextRef.type, nextRef.id)
  }

  function handleMouseMove(event: MapLayerMouseEvent) {
    const placingPin = Boolean(pinPlacement)
    const hoverFeatures = event.features?.filter(isReviewVisible)
    setCursor(
      cursorForMapHover(hoverFeatures, {
        pinPlacement: placingPin,
        overlayActive,
      }),
    )
    if (placingPin) {
      setInspectHover(null)
      setInspectPoint(null)
      setHover(null)
      return
    }
    const inspectHover = inspectHoverFromFeatures(hoverFeatures)
    setInspectHover(inspectHover)
    setInspectPoint(inspectHover ? { x: event.point.x, y: event.point.y } : null)
    setHover(changesetHoverFromFeatures(hoverFeatures))
  }

  function handleMouseLeave() {
    setCursor('default')
    setInspectHover(null)
    setInspectPoint(null)
    setHover(null)
  }

  return (
    <>
      <div ref={containerRef} className="relative h-full w-full">
        {canMountMap && mapStyle && viewer ? (
          <Map
            id={CHANGESET_MAP_ID}
            initialViewState={initialViewState}
            mapStyle={mapStyle}
            // Default control is bottom-right and always expanded. We place our own.
            attributionControl={false}
            maxPitch={0}
            maxZoom={22}
            dragRotate={false}
            pitchWithRotate={false}
            touchPitch={false}
            interactiveLayerIds={interactiveLayerIds}
            cursor={pinPlacement ? 'crosshair' : cursor}
            style={{ width: '100%', height: '100%' }}
            onLoad={handleLoad}
            onMoveEnd={handleMoveEnd}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <Source
              id={CHANGESET_SOURCE_ID}
              type="geojson"
              data={viewer.geojson}
              attribution={typeof viewer.adiff.note === 'string' ? viewer.adiff.note : undefined}
            >
              {/* Nested so vis.gl only mounts layers after addSource. Sibling Layers can
                  no-op when styledata fires before the GeoJSON source exists. */}
              {caseLayers.map((layer: { id: string }) => (
                <Layer key={layer.id} {...(layer as LayerProps)} />
              ))}
              {emphasisLayers.map((layer) => (
                <Layer key={layer.id} {...(layer as LayerProps)} />
              ))}
              {coreLayers.map((layer: { id: string }) => (
                <Layer key={layer.id} {...(layer as LayerProps)} />
              ))}
            </Source>
            {overlayBg && firstFeatureLayerId ? (
              <ChangesetOverlayBackground
                layer={overlayBg as LayerProps}
                beforeId={firstFeatureLayerId}
              />
            ) : null}
            {overlayActive && firstFeatureLayerId ? (
              <SpyglassOverlay beforeId={firstFeatureLayerId} />
            ) : null}
            {/* compact = ⓘ toggle (also collapses on pan). MapLibre still starts expanded. */}
            <AttributionControl compact position="bottom-left" />
            <CollapseCompactAttributionOnMount />
            <PinPlacementOverlay />
            <ChangesetPinMarkers changesetId={changesetId} />
          </Map>
        ) : null}
        {overlayActive && inspectHover && inspectPoint ? (
          <SpyglassInspectFlyout hover={inspectHover} point={inspectPoint} />
        ) : null}
      </div>
      {showError && (
        <ChangesetMapUnavailable
          error={changesetQuery.error}
          onRetry={() => {
            void changesetQuery.refetch()
          }}
        />
      )}
      {showLoading && (
        <div
          className="absolute z-10"
          style={{
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            background: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <Loading height="100%" className="" />
        </div>
      )}
    </>
  )
}

function SpyglassInspectFlyout({
  hover,
  point,
}: {
  hover: InspectHover
  point: { x: number; y: number }
}) {
  return (
    <div
      className={`pointer-events-none absolute z-20 max-w-xs rounded-lg px-2 py-1.5 ${flyoutSurfaceClassName}`}
      style={{ left: point.x + 12, top: point.y + 12 }}
    >
      {hover.items.map((item, index) => (
        <SpyglassInspectFlyoutItem
          key={`${item.type}/${String(item.id)}`}
          item={item}
          isFirst={index === 0}
        />
      ))}
      {hover.extraCount > 0 ? (
        <div className="mt-1 text-xs text-zinc-500">+{hover.extraCount} more</div>
      ) : null}
    </div>
  )
}

function SpyglassInspectFlyoutItem({
  item,
  isFirst,
}: {
  item: InspectHoverItem
  isFirst: boolean
}) {
  const { tags, moreCount } = inspectFlyoutTags(item.tags)
  return (
    <div className={isFirst ? undefined : 'mt-2'}>
      <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-950">
        <InspectKindSwatch kind={item.kind} />
        <span>
          <span className="sr-only">{item.kind === 'noop' ? ACTION.noop.label : 'OSM'} </span>
          {item.type}/{item.id}
        </span>
      </div>
      {tags.length > 0 ? (
        <div className="mt-1 text-xs text-zinc-700">
          {tags.map(([key, value]) => (
            <div key={key} className="truncate">
              {key}={value}
            </div>
          ))}
        </div>
      ) : null}
      {moreCount > 0 ? <div className="mt-1 text-xs text-zinc-500">+{moreCount} more</div> : null}
    </div>
  )
}

/** Dim overlay must sit above the basemap and below changeset features. */
function ChangesetOverlayBackground({ layer, beforeId }: { layer: LayerProps; beforeId: string }) {
  return <Layer {...layer} beforeId={beforeId} />
}

export { CMap }
