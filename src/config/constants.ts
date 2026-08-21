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
