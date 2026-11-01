import { ageBandColorExpression, MAP_FEATURE_COLOR } from '@osm-editor-kit/street-imagery'
import {
  queryStreetImageryFeatures,
  StreetLevelImagerySourcesAndLayers,
  streetImageryInteractiveLayerIds,
  useMapViewportBbox,
} from '@osm-editor-kit/street-imagery-react'
import type { ExpressionSpecification, MapLayerMouseEvent } from 'maplibre-gl'
import { useEffect, useState } from 'react'
import {
  photoAgeCutoff,
  photoTypesOfKind,
  STREET_IMAGERY_LAYER_PROVIDERS,
  STREET_IMAGERY_MIN_ZOOM,
  STREET_IMAGERY_PACKAGE_QUERY_KEYS,
} from '../components/street_imagery/streetImageryLayerSettings.ts'
import { configureStreetImageryLayer } from '../components/street_imagery/streetImageryProviders.ts'
import type { StreetImageryProvider } from '../components/street_imagery/streetImageryTags.ts'
import { queryClient } from '../query/client.ts'
import {
  useEffectiveStreetImageryDate,
  useStreetImageryPhotoKind,
  useStreetImageryProvidersOn,
} from '../stores/street-imagery-layer-store.ts'
import { getStreetImageryViewerActions } from '../stores/street-imagery-viewer-store.ts'
import { CHANGESET_MAP_ID } from './changesetAdiffViewer.ts'
import { hitSlopPx, isTouchInput } from './changesetMapClick.ts'
import { setStreetImageryClickHandler } from './streetImageryMapClick.ts'
import { useMapZoom } from './useMapZoom.ts'

configureStreetImageryLayer()

// The package keys its provider queries by viewport and zoom, so every pan makes new ones. The app
// keeps queries for a week by default; keep these for two minutes, and never refetch them while
// they are kept: the package caches the tiles itself.
for (const key of STREET_IMAGERY_PACKAGE_QUERY_KEYS) {
  queryClient.setQueryDefaults([key], { staleTime: Infinity, gcTime: 2 * 60 * 1000 })
}

function isLayerProvider(providerId: string): providerId is StreetImageryProvider {
  return STREET_IMAGERY_LAYER_PROVIDERS.some((provider) => provider === providerId)
}

/**
 * The photo under the pointer, when there is one. The fat invisible targets of the package make
 * photos easy to hit; the box around the point adds the slop the changeset features get for fingers.
 */
function photoUnder(event: MapLayerMouseEvent) {
  const map = event.target
  const layers = streetImageryInteractiveLayerIds([...STREET_IMAGERY_LAYER_PROVIDERS]).filter(
    (id) => map.getLayer(id) !== undefined,
  )
  if (layers.length === 0) return null
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
    return { provider: item.providerId, id: item.photoId }
  }
  return null
}

function openPhotoFromClick(event: MapLayerMouseEvent) {
  const photo = photoUnder(event)
  if (photo) getStreetImageryViewerActions().openPhoto(photo)
  return photo != null
}

function isOverPhoto(event: MapLayerMouseEvent) {
  return photoUnder(event) != null
}

/**
 * The photos of the providers that are switched on, as dots and sequence lines below the changeset
 * layers. A click on a photo opens the viewer dialog (`openStreetImageryPhotoFromClick`). Render
 * inside `<Map>`, only while a provider is on: the package, `mapillary-js` and the provider code
 * load with the first time this renders.
 */
export default function StreetImageryLayers({ beforeId }: { beforeId?: string }) {
  const providers = useStreetImageryProvidersOn()
  const photoKind = useStreetImageryPhotoKind()
  const [now] = useState(() => Date.now())
  const date = useEffectiveStreetImageryDate()
  const bbox = useMapViewportBbox(CHANGESET_MAP_ID)
  const zoom = useMapZoom(CHANGESET_MAP_ID)

  useEffect(function registerPhotoClick() {
    setStreetImageryClickHandler({ open: openPhotoFromClick, isOver: isOverPhoto })
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
        // The package types its expression loosely, so that its core needs no MapLibre types.
        photoCircleColor: ageBandColorExpression(
          photoAgeCutoff(date, now),
          now,
        ) as ExpressionSpecification,
        mapFeatureCircleColor: MAP_FEATURE_COLOR,
        beforeId,
      }}
    />
  )
}
