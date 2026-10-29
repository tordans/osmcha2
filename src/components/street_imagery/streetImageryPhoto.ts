import {
  fetchMapillaryImages,
  getPanoramaxApiBase,
  providerExternalLink,
  type NormalizedPhoto,
} from '@osm-editor-kit/street-imagery'
import {
  panoramaxPhotoFromItem,
  type PanoramaxItem,
} from '@osm-editor-kit/street-imagery-react/viewer-panels'
import { STREET_IMAGERY_PROVIDER_LABEL, type StreetImageryRef } from './streetImageryTags.ts'

/** The provider has no photo for this id (never uploaded, deleted, or no position). Not retried. */
export class StreetImageryPhotoNotFoundError extends Error {
  readonly provider: StreetImageryRef['provider']

  constructor(provider: StreetImageryRef['provider']) {
    super(`${STREET_IMAGERY_PROVIDER_LABEL[provider]} has no photo for this id`)
    this.name = 'StreetImageryPhotoNotFoundError'
    this.provider = provider
  }
}

/** The photo of one id: date, creator and position, for the viewer and the "Show on map" action. */
export async function fetchStreetImageryPhoto(
  ref: StreetImageryRef,
  signal?: AbortSignal,
): Promise<NormalizedPhoto> {
  if (ref.provider === 'mapillary') {
    const [details] = await fetchMapillaryImages([ref.id], signal)
    if (details?.lngLat == null) throw new StreetImageryPhotoNotFoundError('mapillary')
    return {
      providerId: 'mapillary',
      photoId: details.id,
      sequenceId: details.sequenceId,
      capturedAt: details.capturedAt,
      isPano: details.isPano,
      heading: details.heading,
      lngLat: details.lngLat,
      originalLngLat: details.originalLngLat ?? undefined,
      creatorId: details.creatorId ?? undefined,
      creatorName: details.username ?? undefined,
    }
  }

  const response = await fetch(
    `${getPanoramaxApiBase()}/api/search?ids=${encodeURIComponent(ref.id)}&limit=1`,
    { signal },
  )
  if (!response.ok) throw new Error(`Panoramax search: HTTP ${response.status}`)
  const result = (await response.json()) as { features?: PanoramaxItem[] }
  const item = result.features?.[0]
  if (item == null) throw new StreetImageryPhotoNotFoundError('panoramax')
  return panoramaxPhotoFromItem(item)
}

/** The photo's page on the provider's own site. Needs no request, so it also works for a photo that did not load. */
export function streetImageryPhotoPageUrl(ref: StreetImageryRef) {
  return providerExternalLink({
    providerId: ref.provider,
    photoId: ref.id,
    sequenceId: null,
    capturedAt: null,
    isPano: null,
    heading: null,
    lngLat: [0, 0],
  })
}
