import { MapLibreAugmentedDiffViewer } from '@osmcha/maplibre-adiff-viewer'
import { useThrottledCallback } from '@tanstack/react-pacer'
import 'maplibre-gl/dist/maplibre-gl.css'
import { getRouteApi } from '@tanstack/react-router'
import * as maplibre from 'maplibre-gl'
import React, { useEffect, useEffectEvent, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Loading } from '../components/loading.tsx'
import { SignIn } from '../components/sign_in.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import { useChangesetMap } from '../query/hooks/useChangesetMap.ts'
import { parseMapParam, serializeMapParam } from '../routing/mapParam.ts'
import { useMapStore } from '../stores/mapStore.ts'

const changesetRouteApi = getRouteApi('/changesets/$id')

const BING_AERIAL_IMAGERY_STYLE: maplibre.StyleSpecification = {
  version: 8,
  sources: {
    bing: {
      type: 'raster',
      scheme: 'xyz',
      tiles: [
        'https://ecn.t0.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
        'https://ecn.t1.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
        'https://ecn.t2.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
        'https://ecn.t3.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
      ],
      tileSize: 256,
      maxzoom: 20,
      attribution: 'Imagery © Microsoft Corporation',
    },
  },
  layers: [
    {
      id: 'imagery',
      type: 'raster',
      source: 'bing',
    },
  ],
}

const ESRI_WORLD_IMAGERY_STYLE: maplibre.StyleSpecification = {
  version: 8,
  sources: {
    esri: {
      type: 'raster',
      scheme: 'xyz',
      tiles: [
        'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?blankTile=false',
        'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?blankTile=false',
      ],
      tileSize: 256,
      maxzoom: 20,
      attribution: 'Imagery © Esri',
    },
  },
  layers: [
    {
      id: 'imagery',
      type: 'raster',
      source: 'esri',
    },
  ],
}

const ESRI_WORLD_IMAGERY_CLARITY_STYLE: maplibre.StyleSpecification = {
  version: 8,
  sources: {
    esri: {
      type: 'raster',
      scheme: 'xyz',
      tiles: [
        'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?blankTile=false',
      ],
      tileSize: 256,
      maxzoom: 20,
      attribution: 'Imagery © Esri',
    },
  },
  layers: [
    {
      id: 'imagery',
      type: 'raster',
      source: 'esri',
    },
  ],
}

const OPENSTREETMAP_CARTO_STYLE: maplibre.StyleSpecification = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
}

const BASEMAP_STYLES = {
  bing: BING_AERIAL_IMAGERY_STYLE,
  esri: ESRI_WORLD_IMAGERY_STYLE,
  'esri-clarity': ESRI_WORLD_IMAGERY_CLARITY_STYLE,
  carto: OPENSTREETMAP_CARTO_STYLE,
}

const DEFAULT_BASEMAP_STYLE = BING_AERIAL_IMAGERY_STYLE

function serializeMapCamera(map: maplibre.Map) {
  const center = map.getCenter()
  return serializeMapParam({
    zoom: map.getZoom(),
    lat: center.lat,
    lng: center.lng,
  })
}

interface CMapProps {
  changesetId: number | null
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

  // URL `?map=` is the camera. MapLibre is the view. Write only when the view differs.
  const replaceMapSearch = useEffectEvent((map: maplibre.Map) => {
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
      const parsed = parseMapParam(mapSearch ?? '')
      if (parsed) {
        if (serializeMapCamera(map) !== mapSearch) {
          map.jumpTo({
            center: [parsed.lng, parsed.lat],
            zoom: parsed.zoom,
          })
        }
        return
      }

      if (viewer.adiff.actions.length === 0) {
        toast.error('Problem loading augmented diff file', {
          description: 'The augmented diff contains no elements',
        })
        return
      }

      const camera = map.cameraForBounds(viewer.bounds(), {
        padding: 200,
        maxZoom: 18,
      })
      if (camera) {
        map.jumpTo(camera)
        replaceMapSearch(map)
      }
    },
  )

  const onMapMoveEnd = useEffectEvent((map: maplibre.Map) => {
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
      const container = document.getElementById('container')
      if (!changeset || !container) {
        return
      }

      const currentStyleId = useMapStore.getState().style
      const mapStyle = BASEMAP_STYLES[currentStyleId] ?? DEFAULT_BASEMAP_STYLE

      const map = new maplibre.Map({
        container,
        style: mapStyle,
        maxZoom: 22,
        hash: false,
        attributionControl: false,
      })

      map.addControl(new maplibre.AttributionControl(), 'bottom-left')

      map.setMaxPitch(0)
      map.dragRotate.disable()
      map.touchZoomRotate.disableRotation()
      map.keyboard.disableRotation()

      const adiff = {
        ...changeset.adiff,
        note: 'Map data from <a href=https://openstreetmap.org/copyright>OpenStreetMap</a>',
      }
      const adiffViewer = new MapLibreAugmentedDiffViewer(adiff, {
        onClick: onMapClick,
      })

      map.on('load', () => {
        clearSelected()
        adiffViewer.addTo(map)
        setMapReady(true)
      })

      mapRef.current = map
      adiffViewerRef.current = adiffViewer
      mapHandleRef.current = {
        map,
        adiffViewer,
      }

      return function teardownChangesetMap() {
        setMapReady(false)
        mapHandleRef.current = null
        map.remove()
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
  const appliedStyleRef = useRef(style)
  useEffect(
    function applyBasemapStyle() {
      if (!mapReady || !mapRef.current) return
      if (appliedStyleRef.current === style) return
      appliedStyleRef.current = style
      mapRef.current.setStyle(BASEMAP_STYLES[style] ?? DEFAULT_BASEMAP_STYLE)
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
      <div id="container" className="h-full w-full" />
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
