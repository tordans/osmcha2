/**
 * OSM OAuth 2 apps for posting changeset comments (scopes: read_prefs, write_changeset_comments;
 * public client with PKCE, no secret):
 * - openstreetmap.org, account tordans: https://www.openstreetmap.org/oauth2/applications/4790
 *   Redirect https://tordans.github.io/osmcha2/osm-oauth. Client id is the GitHub repo variable
 *   VITE_OSM_OAUTH_CLIENT_ID, read by .github/workflows/deploy-pages.yml.
 * - OSM sandbox, account tordansdev: https://master.apis.dev.openstreetmap.org/oauth2/applications/1596
 *   Redirect http://127.0.0.1:5287/osm-oauth (fixed in vite.config.js). Client id and sandbox
 *   URLs go in .env.local, see .env.example.
 */
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

function isOsmAuthConfigured() {
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
