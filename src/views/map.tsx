import { MapLibreAugmentedDiffViewer } from '@osmcha/maplibre-adiff-viewer'
import { useThrottledCallback } from '@tanstack/react-pacer'
import 'maplibre-gl/dist/maplibre-gl.css'
import { getRouteApi } from '@tanstack/react-router'
import * as maplibre from 'maplibre-gl'
import React, { useEffect, useEffectEvent, useRef, useState } from 'react'
import { toast } from 'sonner'
import { resolveBasemapStyle } from '../components/changeset/basemapStyles.ts'
import { matchImageryUsedStyleId } from '../components/changeset/matchImageryUsed.ts'
import { Loading } from '../components/loading.tsx'
import { SignIn } from '../components/sign_in.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import { useChangesetMap } from '../query/hooks/useChangesetMap.ts'
import { parseMapParam, serializeMapParam } from '../routing/mapParam.ts'
import { useMapStore } from '../stores/mapStore.ts'
import {
  changesetCameraIntent,
  changesetFitOptions,
  jumpMapToChangesetBounds,
} from './changesetCamera.ts'
import { changesetViewBounds } from './changesetViewBounds.ts'

const changesetRouteApi = getRouteApi('/changesets/$id')

function serializeMapCamera(map: maplibre.Map) {
  const center = map.getCenter()
  return serializeMapParam({
    zoom: map.getZoom(),
    lat: center.lat,
    lng: center.lng,
  })
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

function applyBasemapToMap(
  map: maplibre.Map,
  spec: maplibre.StyleSpecification,
  viewer: { refresh: () => void } | null,
) {
  const refreshOverlays = () => {
    viewer?.refresh()
  }
  map.setStyle(spec)
  if (map.isStyleLoaded()) {
    refreshOverlays()
  } else {
    void map.once('style.load', refreshOverlays)
  }
}

interface CMapProps {
  changesetId: number | null
  imageryUsed?: string | null
  className: string
  showElements: Array<string>
  showActions: Array<string>
  mapRef: React.RefObject<{
    map: maplibre.Map
    adiffViewer: MapLibreAugmentedDiffViewer
  } | null>
  setSelected: (action: any) => void
}

function CMap({
  changesetId,
  imageryUsed,
  showElements,
  showActions,
  mapRef: mapHandleRef,
  setSelected,
}: CMapProps) {
  const { token } = useAuth()
  const { map: mapSearch } = changesetRouteApi.useSearch()
  const navigate = changesetRouteApi.useNavigate()
  const style = useMapStore((state) => state.style)
  const changesetQuery = useChangesetMap(changesetId)
  const mapRef = useRef<maplibre.Map | null>(null)
  const adiffViewerRef = useRef<MapLibreAugmentedDiffViewer>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const appliedStyleRef = useRef(style)
  const applyingCameraRef = useRef(false)
  const urlWritesEnabledRef = useRef(false)
  const [mapReady, setMapReady] = useState(false)

  const hasAdiff = Boolean(changesetQuery.data)

  const onMapClick = useEffectEvent((event: any, action: any) => {
    setSelected(action)

    if (action) {
      const element = action.new ?? action.old
      adiffViewerRef.current?.select(element.type, element.id)
    } else {
      adiffViewerRef.current?.deselect()
    }
  })

  const clearSelected = useEffectEvent(() => {
    setSelected(null)
  })

  const readAdiff = useEffectEvent(() => changesetQuery.data)
  const readImageryUsed = useEffectEvent(() => imageryUsed)
  const readMapSearch = useEffectEvent(() => mapSearch)

  // `?map=` is the user's camera for this visit. Missing `?map=` means fit the changeset.
  const replaceMapSearch = useEffectEvent((map: maplibre.Map) => {
    if (!urlWritesEnabledRef.current) return
    const next = serializeMapCamera(map)
    if (next === mapSearch) return
    void navigate({
      search: (prev) => ({ ...prev, map: next }),
      replace: true,
    })
  })

  const writeMapToUrl = useThrottledCallback(
    (map: maplibre.Map) => {
      replaceMapSearch(map)
    },
    { wait: 250 },
  )

  const applyCameraFromSearch = useEffectEvent(
    (map: maplibre.Map, viewer: MapLibreAugmentedDiffViewer) => {
      applyingCameraRef.current = true
      try {
        const intent = changesetCameraIntent(mapSearch)
        if (intent.type === 'restore') {
          if (serializeMapCamera(map) !== mapSearch) {
            map.jumpTo({
              center: [intent.camera.lng, intent.camera.lat],
              zoom: intent.camera.zoom,
            })
          }
          urlWritesEnabledRef.current = true
          return
        }

        if (viewer.adiff.actions.length === 0) {
          toast.error('Problem loading augmented diff file', {
            description: 'The augmented diff contains no elements',
          })
          return
        }

        const bounds = changesetViewBounds(viewer.geojson.features)
        if (!bounds) return
        map.resize()
        jumpMapToChangesetBounds(map, bounds)
        urlWritesEnabledRef.current = true
      } finally {
        applyingCameraRef.current = false
      }
    },
  )

  const onMapMoveEnd = useEffectEvent((map: maplibre.Map) => {
    if (applyingCameraRef.current) return
    writeMapToUrl(map)
  })

  // Instance ownership: create MapLibre when this changeset's adiff is available.
  // Do not depend on the Query object identity — refetches must not remount the map.
  useEffect(
    function initializeChangesetMap() {
      if (!token || !changesetId || !hasAdiff) {
        return
      }

      const changeset = readAdiff()
      const mapContainer = containerRef.current
      if (!changeset || !mapContainer) {
        return
      }
      const host = mapContainer

      let cancelled = false
      let map: maplibre.Map | null = null

      async function createChangesetMap() {
        await waitForMapStoreHydration()
        if (cancelled || !changeset) return

        const matchedStyleId = matchImageryUsedStyleId(readImageryUsed())
        const styleId = matchedStyleId ?? useMapStore.getState().style
        if (matchedStyleId) {
          useMapStore.getState().setStyle(matchedStyleId)
        }

        const mapStyle = await resolveBasemapStyle(styleId)
        if (cancelled) return

        const adiff = {
          ...changeset.adiff,
          note: 'Map data from <a href=https://openstreetmap.org/copyright>OpenStreetMap</a>',
        }
        const adiffViewer = new MapLibreAugmentedDiffViewer(adiff, {
          onClick: onMapClick,
        })

        const parsedCamera = parseMapParam(readMapSearch() ?? '')
        const viewBounds = changesetViewBounds(adiffViewer.geojson.features)
        const fitOptions = changesetFitOptions(host.clientWidth, host.clientHeight)

        const createdMap = new maplibre.Map({
          container: host,
          style: mapStyle,
          maxZoom: 22,
          hash: false,
          attributionControl: false,
          ...(parsedCamera
            ? { center: [parsedCamera.lng, parsedCamera.lat], zoom: parsedCamera.zoom }
            : viewBounds && fitOptions
              ? { bounds: viewBounds, fitBoundsOptions: fitOptions }
              : {}),
        })
        map = createdMap

        createdMap.addControl(new maplibre.AttributionControl(), 'bottom-left')

        createdMap.setMaxPitch(0)
        createdMap.dragRotate.disable()
        createdMap.touchZoomRotate.disableRotation()
        createdMap.keyboard.disableRotation()

        createdMap.on('load', () => {
          clearSelected()
          adiffViewer.addTo(createdMap)
          appliedStyleRef.current = styleId
          setMapReady(true)
        })

        mapRef.current = createdMap
        adiffViewerRef.current = adiffViewer
        mapHandleRef.current = {
          map: createdMap,
          adiffViewer,
        }
      }

      void createChangesetMap()

      return function teardownChangesetMap() {
        cancelled = true
        urlWritesEnabledRef.current = false
        setMapReady(false)
        mapHandleRef.current = null
        map?.remove()
        mapRef.current = null
        adiffViewerRef.current = null
      }
    },
    [token, changesetId, hasAdiff, mapHandleRef],
  )

  // Camera ownership: URL → map when search changes; map → URL on user moveend.
  useEffect(
    function applySearchCamera() {
      if (!mapReady) return
      const map = mapRef.current
      const viewer = adiffViewerRef.current
      if (!map || !viewer) return
      applyCameraFromSearch(map, viewer)
    },
    [mapReady, mapSearch],
  )

  useEffect(
    function refitWhenContainerResizes() {
      if (!mapReady) return
      const map = mapRef.current
      const viewer = adiffViewerRef.current
      const container = containerRef.current
      if (!map || !viewer || !container) return

      const observer = new ResizeObserver(() => {
        map.resize()
        if (changesetCameraIntent(readMapSearch()).type === 'fit') {
          applyCameraFromSearch(map, viewer)
        }
      })
      observer.observe(container)
      return function disconnectResizeObserver() {
        observer.disconnect()
      }
    },
    [mapReady],
  )

  useEffect(
    function subscribeMapMoveEnd() {
      if (!mapReady) return
      const map = mapRef.current
      if (!map) return

      const handleMoveEnd = () => {
        onMapMoveEnd(map)
      }
      map.on('moveend', handleMoveEnd)
      return function unsubscribeMapMoveEnd() {
        map.off('moveend', handleMoveEnd)
      }
    },
    [mapReady],
  )

  // Basemap is Zustand. Init already painted `style`; only setStyle when it changes.
  useEffect(
    function applyBasemapStyle() {
      if (!mapReady || !mapRef.current) return
      if (appliedStyleRef.current === style) return
      let cancelled = false
      void resolveBasemapStyle(style).then((spec) => {
        if (cancelled || !mapRef.current) return
        appliedStyleRef.current = style
        applyBasemapToMap(mapRef.current, spec, adiffViewerRef.current)
      })
      return function cancelApplyBasemapStyle() {
        cancelled = true
      }
    },
    [mapReady, style],
  )

  useEffect(
    function applyViewerFilters() {
      if (!mapReady || !adiffViewerRef.current) return

      adiffViewerRef.current.options = {
        onClick: onMapClick,
        showElements,
        showActions,
      }

      adiffViewerRef.current.refresh()
    },
    [mapReady, showElements, showActions],
  )

  if (!token) {
    return <SignIn />
  }

  return (
    <React.Fragment>
      <div ref={containerRef} className="h-full w-full" />
      {(!mapReady || changesetQuery.isLoading) && (
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
    </React.Fragment>
  )
}

export { CMap }
