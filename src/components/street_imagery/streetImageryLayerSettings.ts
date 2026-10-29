import type { DateRange, PhotoTypeFilter } from '@osm-editor-kit/street-imagery'
import type { StreetImageryProvider } from './streetImageryTags.ts'

/** Providers of the map layer, in the order the panel lists them. */
export const STREET_IMAGERY_LAYER_PROVIDERS: readonly StreetImageryProvider[] = [
  'mapillary',
  'panoramax',
]

export type StreetImageryPhotoKind = 'all' | 'flat' | 'pano'

export const STREET_IMAGERY_PHOTO_KINDS: readonly StreetImageryPhotoKind[] = ['all', 'flat', 'pano']

/** Photos newer than this many years show until the person picks another range. */
export const DEFAULT_PHOTO_MAX_AGE_YEARS = 2

/**
 * Below this map zoom no photos are requested or drawn. Mapillary's track tiles are several MB
 * each in dense areas when zoomed out. A MapLibre zoom (512 px tiles), so 13 is zoom 14 of the
 * OSM scale.
 */
export const STREET_IMAGERY_MIN_ZOOM = 13

/** The photo type filter of the layers for a choice; `undefined` shows both kinds. */
export function photoTypesOfKind(kind: StreetImageryPhotoKind): PhotoTypeFilter[] | undefined {
  if (kind === 'flat') return ['flat']
  if (kind === 'pano') return ['pano']
  return undefined
}

/** The day `years` years before `now`, as `YYYY-MM-DD` (UTC, like the package's day filter). */
export function dayYearsAgo(years: number, now: Date) {
  const day = new Date(Date.UTC(now.getUTCFullYear() - years, now.getUTCMonth(), now.getUTCDate()))
  return day.toISOString().slice(0, 10)
}

/** Photos from the last two years. No end: new photos show too. */
export function defaultPhotoDate(now: Date = new Date()): DateRange {
  return { from: dayYearsAgo(DEFAULT_PHOTO_MAX_AGE_YEARS, now) }
}

/**
 * The default range, fixed when the page loads so the layer's filter stays the same object between
 * renders (a new day does not change a page that is already open).
 */
export const DEFAULT_PHOTO_DATE: DateRange = defaultPhotoDate()
