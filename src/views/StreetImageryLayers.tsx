import {
  MAP_FEATURE_COLOR,
  photoTypeColorExpression,
  registerProviderAdapters,
} from '@osm-editor-kit/street-imagery'
import {
  queryStreetImageryFeatures,
  StreetLevelImagerySourcesAndLayers,
  streetImageryInteractiveLayerIds,
  useMapViewportBbox,
} from '@osm-editor-kit/street-imagery-react'
import { mapillaryAdapter } from '@osm-editor-kit/street-imagery/providers/mapillary'
import { panoramaxAdapter } from '@osm-editor-kit/street-imagery/providers/panoramax'
import type { MapLayerMouseEvent } from 'maplibre-gl'
import { useEffect, useSyncExternalStore } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import {
  photoTypesOfKind,
  STREET_IMAGERY_LAYER_PROVIDERS,
  STREET_IMAGERY_MIN_ZOOM,
  STREET_IMAGERY_PACKAGE_QUERY_KEYS,
} from '../components/street_imagery/streetImageryLayerSettings.ts'
import { configureStreetImagery } from '../components/street_imagery/streetImageryRuntime.ts'
import type { StreetImageryProvider } from '../components/street_imagery/streetImageryTags.ts'
import { queryClient } from '../query/client.ts'
import {
  useEffectiveStreetImageryDate,
  useMapillaryLayerOn,
  usePanoramaxLayerOn,
  useStreetImageryPhotoKind,
} from '../stores/street-imagery-layer-store.ts'
import { getStreetImageryViewerActions } from '../stores/street-imagery-viewer-store.ts'
import { CHANGESET_MAP_ID } from './changesetAdiffViewer.ts'
import { hitSlopPx, isTouchInput } from './changesetMapClick.ts'
import { setStreetImageryClickHandler } from './streetImageryMapClick.ts'

configureStreetImagery()
registerProviderAdapters([mapillaryAdapter, panoramaxAdapter])

// The package keys its provider queries by viewport and zoom, so every pan makes new ones. The app
// keeps queries for a week by default; keep these for two minutes, and never refetch them while
// they are kept: the package caches the tiles itself.
for (const key of STREET_IMAGERY_PACKAGE_QUERY_KEYS) {
  queryClient.setQueryDefaults([key], { staleTime: Infinity, gcTime: 2 * 60 * 1000 })
}

function isLayerProvider(providerId: string): providerId is StreetImageryProvider {
  return STREET_IMAGERY_LAYER_PROVIDERS.some((provider) => provider === providerId)
}

/** The map zoom, read again when a move ends. */
function useMapZoom(mapId: string) {
  const map = useMap()[mapId]?.getMap()
  return useSyncExternalStore(
    (onChange) => {
      map?.on('moveend', onChange)
      return () => {
        map?.off('moveend', onChange)
      }
    },
    () => map?.getZoom() ?? 0,
  )
}

/**
 * Opens the photo under a click, when there is one. The map's click handler only asks after no
 * changeset feature was hit. The fat invisible targets of the package make photos easy to hit; the
 * box around the point adds the slop the changeset features get for fingers.
 */
function openPhotoFromClick(event: MapLayerMouseEvent) {
  const map = event.target
  const layers = streetImageryInteractiveLayerIds([...STREET_IMAGERY_LAYER_PROVIDERS]).filter(
    (id) => map.getLayer(id) !== undefined,
  )
  if (layers.length === 0) return false
  const slop = hitSlopPx(isTouchInput(event.originalEvent))
  const { x, y } = event.point
  const features = map.queryRenderedFeatures(
    [
      [x - slop, y - slop],
      [x + slop, y + slop],
    ],
    { layers },
  )
  for (const item of queryStreetImageryFeatures({ features })) {
    if (item.kind !== 'photo' || !item.photoId || !isLayerProvider(item.providerId)) continue
    getStreetImageryViewerActions().openPhoto({ provider: item.providerId, id: item.photoId })
    return true
  }
  return false
}

/**
 * The photos of the providers that are switched on, as dots and sequence lines below the changeset
 * layers. A click on a photo opens the viewer dialog (`openStreetImageryPhotoFromClick`). Render
 * inside `<Map>`, only while a provider is on: the package, `mapillary-js` and the provider code
 * load with the first time this renders.
 */
export default function StreetImageryLayers({ beforeId }: { beforeId?: string }) {
  const mapillaryOn = useMapillaryLayerOn()
  const panoramaxOn = usePanoramaxLayerOn()
  const photoKind = useStreetImageryPhotoKind()
  const date = useEffectiveStreetImageryDate()
  const bbox = useMapViewportBbox(CHANGESET_MAP_ID)
  const zoom = useMapZoom(CHANGESET_MAP_ID)
  const providers = STREET_IMAGERY_LAYER_PROVIDERS.filter((provider) =>
    provider === 'mapillary' ? mapillaryOn : panoramaxOn,
  )

  useEffect(function registerPhotoClick() {
    setStreetImageryClickHandler(openPhotoFromClick)
    return function unregisterPhotoClick() {
      setStreetImageryClickHandler(null)
    }
  }, [])

  return (
    <StreetLevelImagerySourcesAndLayers
      providers={providers}
      bbox={bbox}
      zoom={zoom}
      filter={{ photoTypes: photoTypesOfKind(photoKind), date }}
      options={{
        minZoom: STREET_IMAGERY_MIN_ZOOM,
        photoCircleColor: photoTypeColorExpression,
        mapFeatureCircleColor: MAP_FEATURE_COLOR,
        beforeId,
      }}
    />
  )
}
