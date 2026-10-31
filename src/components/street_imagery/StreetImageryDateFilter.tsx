import {
  PhotoDateRangeFilter,
  useAllProviderPhotos,
  useMapViewportBbox,
} from '@osm-editor-kit/street-imagery-react'
import {
  useEffectiveStreetImageryDate,
  useStreetImageryDate,
  useStreetImageryLayerActions,
  useStreetImageryPhotoKind,
  useStreetImageryProvidersOn,
} from '../../stores/street-imagery-layer-store.ts'
import { CHANGESET_MAP_ID } from '../../views/changesetAdiffViewer.ts'
import { useMapZoom } from '../../views/useMapZoom.ts'
import {
  DEFAULT_PHOTO_MAX_AGE_YEARS,
  photoTypesOfKind,
  STREET_IMAGERY_MIN_ZOOM,
} from './streetImageryLayerSettings.ts'
import { configureStreetImageryLayer } from './streetImageryProviders.ts'

// This chunk can arrive before the map's layer does.
configureStreetImageryLayer()

/**
 * The package's date slider for the photo layer, in a chunk of its own: it loads when the panel
 * first shows it. Choosing a range replaces the default (the last two years) until reset.
 */
export default function StreetImageryDateFilter() {
  const date = useEffectiveStreetImageryDate()
  const chosen = useStreetImageryDate()
  const { setDate } = useStreetImageryLayerActions()
  // The bars show what the view holds before the date filter, so they answer "which range?". Same
  // providers, view and zoom as the map's layer: its queries answer, nothing loads twice.
  const providers = useStreetImageryProvidersOn()
  const bbox = useMapViewportBbox(CHANGESET_MAP_ID)
  const zoom = useMapZoom(CHANGESET_MAP_ID)
  const photoKind = useStreetImageryPhotoKind()
  const { photos } = useAllProviderPhotos(
    providers,
    // Below this the map's layer asks for nothing, and a wide view would ask for far too much.
    zoom >= STREET_IMAGERY_MIN_ZOOM ? bbox : null,
    zoom,
    photoTypesOfKind(photoKind),
  )

  return (
    <div className="space-y-2">
      <PhotoDateRangeFilter
        value={date}
        onChange={setDate}
        capturedAt={photos.map((photo) => photo.capturedAt)}
        yearLines={[1, 2, 3, 4]}
        recommendedMaxAgeYears={DEFAULT_PHOTO_MAX_AGE_YEARS}
      />
      {chosen !== null ? (
        <button
          type="button"
          onClick={() => setDate(null)}
          className="min-h-9 cursor-pointer touch-manipulation text-sm text-zinc-600 underline decoration-zinc-400 underline-offset-2 hover:text-zinc-900"
        >
          Back to the last {DEFAULT_PHOTO_MAX_AGE_YEARS} years
        </button>
      ) : null}
    </div>
  )
}
