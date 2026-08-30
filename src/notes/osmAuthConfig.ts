const DEFAULT_AUTH_URL = 'https://www.openstreetmap.org'
const DEFAULT_API_URL = 'https://api.openstreetmap.org'
const SANDBOX_HOST = 'apis.dev.openstreetmap.org'

export function osmOAuthClientId() {
  return import.meta.env.VITE_OSM_OAUTH_CLIENT_ID?.trim() ?? ''
}

export function osmAuthUrl() {
  return (import.meta.env.VITE_OSM_AUTH_URL?.trim() || DEFAULT_AUTH_URL).replace(/\/$/, '')
}

export function osmApiUrl() {
  return (import.meta.env.VITE_OSM_API_URL?.trim() || DEFAULT_API_URL).replace(/\/$/, '')
}

export function isOsmAuthConfigured() {
  return osmOAuthClientId().length > 0
}

export function isOsmSandboxAuth() {
  try {
    return new URL(osmAuthUrl()).hostname.endsWith(SANDBOX_HOST)
  } catch {
    return false
  }
}

/** Direct OSM posts from a local build only when pointed at the sandbox. */
export function canUseOsmAuthFromThisBuild() {
  if (!isOsmAuthConfigured()) return false
  if (import.meta.env.DEV && !isOsmSandboxAuth()) return false
  return true
}

export function osmOAuthRedirectUri() {
  const origin = window.location.origin
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${origin}${base}/osm-oauth`
}
