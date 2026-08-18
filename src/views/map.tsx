import { MapLibreAugmentedDiffViewer } from '@osmcha/maplibre-adiff-viewer'
import * as maplibre from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import React, { useEffect, useEffectEvent, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Loading } from '../components/loading.tsx'
import { SignIn } from '../components/sign_in.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import { useChangesetMap } from '../query/hooks/useChangesetMap.ts'
import { useMapStore } from '../stores/mapStore.ts'

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
  setCamera: (camera: any) => void
}

function CMap({
  changesetId,
  showElements,
  showActions,
  mapRef: mapHandleRef,
  setSelected,
  setCamera,
}: CMapProps) {
  const { token } = useAuth()
  const style = useMapStore((state) => state.style)
  const changesetQuery = useChangesetMap(changesetId)
  const mapRef = useRef<maplibre.Map | null>(null)
  const adiffViewerRef = useRef<MapLibreAugmentedDiffViewer>(null)
  const [readyChangeset, setReadyChangeset] = useState<typeof changesetQuery.data>()

  const changeset = changesetQuery.data
  const loading = readyChangeset !== changeset

  const onMapClick = useEffectEvent((event: any, action: any) => {
    setSelected(action)

    if (action) {
      const element = action.new ?? action.old
      adiffViewerRef.current?.select(element.type, element.id)
    } else {
      adiffViewerRef.current?.deselect()
    }
  })

  const onMapMoveEnd = useEffectEvent((map: maplibre.Map) => {
    setCamera({
      center: map.getCenter(),
      zoom: map.getZoom(),
    })
  })

  // Initialize map when changeset data is loaded.
  // Only recreate the map when token or changeset changes.
  useEffect(
    function initializeChangesetMap() {
      if (!token || !changeset) {
        return
      }

      const container = document.getElementById('container')
      if (!container) {
        return
      }

      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        adiffViewerRef.current = null
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
        setSelected(null)
        setReadyChangeset(changeset)
        adiffViewer.addTo(map)

        if (adiff.actions.length > 0) {
          const camera = map.cameraForBounds(adiffViewer.bounds(), {
            padding: 200,
            maxZoom: 18,
          })
          if (camera) {
            map.jumpTo(camera)
          }
        } else {
          toast.error('Problem loading augmented diff file', {
            description: 'The augmented diff contains no elements',
          })
        }
      })

      map.on('moveend', () => {
        onMapMoveEnd(map)
      })

      mapRef.current = map
      adiffViewerRef.current = adiffViewer
      mapHandleRef.current = {
        map,
        adiffViewer,
      }

      return function teardownChangesetMap() {
        mapHandleRef.current = null
        map.remove()
        mapRef.current = null
        adiffViewerRef.current = null
      }
    },
    [token, changeset, mapHandleRef, setSelected],
  )

  useEffect(
    function synchronizeMapPresentation() {
      if (!mapRef.current || !adiffViewerRef.current) return

      const basemapStyle = BASEMAP_STYLES[style] ?? DEFAULT_BASEMAP_STYLE
      mapRef.current.setStyle(basemapStyle)

      adiffViewerRef.current.options = {
        onClick: onMapClick,
        showElements,
        showActions,
      }

      adiffViewerRef.current.refresh()
    },
    [style, showElements, showActions],
  )

  if (!token) {
    return <SignIn />
  }

  return (
    <React.Fragment>
      <div id="container" className="h-full w-full" />
      {(loading || changesetQuery.isLoading) && (
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
