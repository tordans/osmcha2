import pkg from '../../package.json'

const isLocal = import.meta.env.DEV
const appVersion = pkg.version
export const appVersionLabel = `v${appVersion}${isLocal ? ' Local' : ''}`

export const githubContributingUrl =
  'https://github.com/osmcha/osmcha-frontend/blob/master/CONTRIBUTING.md'
export const donateUrl = 'https://openstreetmap.app.neoncrm.com/forms/osmcha'

export const API_URL = 'https://osmcha.org/api/v1'
export const PAGE_SIZE = 25
/**
 * Rewrites an OSMCha or WhoDidIt changeset RSS feed (`?url=`) so entries link here.
 * Hosted by TILDA (`app/src/routes/api/osmcha2-rss-rewrite.ts` in FixMyBerlin/tilda-geo).
 */
export const RSS_REWRITE_URL = 'https://tilda-geo.de/api/osmcha2-rss-rewrite'
export const overpassBase = 'https://overpass-api.de/api/interpreter'
export const statusUrl =
  'https://raw.githubusercontent.com/osmcha/osmcha-frontend/status/status.json'

export const osmchaSocialTokenUrl = `${API_URL}/social-auth/`

export const apiOSM = 'https://api.openstreetmap.org/api/0.6'
export const adiffServiceUrl = 'https://adiffs.osmcha.org'

export const whosThat = 'https://whosthat.osmz.ru/whosthat.php?action=names&id='

export const nominatimUrl = 'https://nominatim.openstreetmap.org/search.php'
/** Nominatim usage policy: at most one request per second. Place search waits for this gap. */
export const NOMINATIM_SEARCH_MIN_INTERVAL_MS = 1000

/** Default list start: this many days before today. */
export const DEFAULT_FROM_DATE = 2
/** Hide changesets newer than this many minutes (adiff tiles lag OSMCha ingest). */
export const DEFAULT_TO_DATE = 5

/**
 * Public site root emitted in posted See URLs (no trailing slash).
 * Includes the GitHub Pages base path. Never localhost. Posted OSM text is public.
 */
export const NOTE_PUBLIC_ORIGIN = 'https://tordans.github.io/osmcha2'

/** Hostnames accepted when parsing See URLs (compare case-insensitively). */
export const NOTE_LINK_HOSTS = [
  'tordans.github.io',
  'osmcha.org',
  'www.osmcha.org',
  'localhost',
  '127.0.0.1',
] as const

/**
 * Path prefixes before `/changesets/{id}` in a See URL.
 * Empty is the site root (local Vite, osmcha.org). `/osmcha2` is GitHub Pages.
 */
export const NOTE_LINK_PATH_PREFIXES = ['', '/osmcha2'] as const

/**
 * Mapillary client token for the street-level photo layer and viewer. A client token is made for
 * the browser, so it is public and part of every built page. It belongs to the Mapillary account
 * `tordans` and is shared with Maid: both apps together get 50,000 tile requests a day.
 * Override it with `VITE_MAPILLARY_TOKEN` (own Mapillary application, https://www.mapillary.com/dashboard/developers).
 */
export const MAPILLARY_TOKEN =
  (import.meta.env.VITE_MAPILLARY_TOKEN ?? '').trim() ||
  'MLY|39514138868200192|9f56cdfee9f25db7c536b4c5aacdfd9b'
