import { rankPhotosLookingAt } from '@osm-editor-kit/street-imagery'
import { mapillaryTilePhotoSource } from '@osm-editor-kit/street-imagery/providers/mapillary'
import type { PlacePhoto } from '../../stores/street-imagery-viewer-store.ts'
import { configureStreetImageryLayer } from './streetImageryProviders.ts'

configureStreetImageryLayer()

const TIMEOUT_MS = 20_000
/** Half the view of a normal photo: what stands further off its axis is not what it shows. */
const MAX_ANGLE_DEG = 35

/** The photos that look at a place, the best first. Requests only when called. */
export async function findPhotosLookingAt(place: [lng: number, lat: number]) {
  const photos = await mapillaryTilePhotoSource.fetchNear(place, AbortSignal.timeout(TIMEOUT_MS))
  return (
    rankPhotosLookingAt(place, photos, { now: Date.now(), maxFlatAngleDeg: MAX_ANGLE_DEG })
      // Very close photos count at any angle; one that looks away shows nothing of the place.
      .filter((candidate) => candidate.angleDiff <= MAX_ANGLE_DEG)
      .map(({ photo, bearingToPlace }): PlacePhoto => ({
        provider: 'mapillary',
        id: photo.photoId,
        bearing: bearingToPlace,
      }))
  )
}
