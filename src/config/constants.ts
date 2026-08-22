import pkg from '../../package.json'

const isLocal = import.meta.env.DEV
const appVersion = pkg.version
export const appVersionLabel = `v${appVersion}${isLocal ? ' Local' : ''}`

export const githubContributingUrl =
  'https://github.com/osmcha/osmcha-frontend/blob/master/CONTRIBUTING.md'
export const donateUrl = 'https://openstreetmap.app.neoncrm.com/forms/osmcha'

export const API_URL = 'https://osmcha.org/api/v1'
export const PAGE_SIZE = 25
export const overpassBase = 'https://overpass-api.de/api/interpreter'
export const statusUrl =
  'https://raw.githubusercontent.com/osmcha/osmcha-frontend/status/status.json'

export const osmchaSocialTokenUrl = `${API_URL}/social-auth/`

export const apiOSM = 'https://api.openstreetmap.org/api/0.6'
export const adiffServiceUrl = 'https://adiffs.osmcha.org'

export const whosThat = 'https://whosthat.osmz.ru/whosthat.php?action=names&id='

export const nominatimUrl = 'https://nominatim.openstreetmap.org/search.php'

/** Default list start: this many days before today. */
export const DEFAULT_FROM_DATE = 2
/** Hide changesets newer than this many minutes (adiff tiles lag OSMCha ingest). */
export const DEFAULT_TO_DATE = 5

/**
 * Public site root emitted in posted See URLs (no trailing slash).
 * Includes the GitHub Pages base path. Never localhost — posted OSM text is public.
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
