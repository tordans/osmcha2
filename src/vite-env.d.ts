/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE?: string
  /** OSM OAuth 2 public client id for posting discussion notes. Empty = Django fallback only. */
  readonly VITE_OSM_OAUTH_CLIENT_ID?: string
  /** OSM site origin for osm-auth, e.g. https://www.openstreetmap.org or the sandbox. */
  readonly VITE_OSM_AUTH_URL?: string
  /** OSM API origin, e.g. https://api.openstreetmap.org. */
  readonly VITE_OSM_API_URL?: string
}

interface Window {
  __mainMap?: import('maplibre-gl').Map
}
