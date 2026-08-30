import { osmAuth } from 'osm-auth'
import {
  canUseOsmAuthFromThisBuild,
  osmApiUrl,
  osmAuthUrl,
  osmOAuthClientId,
  osmOAuthRedirectUri,
} from './osmAuthConfig.ts'

type OsmAuthClient = InstanceType<typeof osmAuth>

let client: OsmAuthClient | null = null

export function getOsmAuth(): OsmAuthClient | null {
  if (!canUseOsmAuthFromThisBuild()) return null
  if (!client) {
    client = new osmAuth({
      client_id: osmOAuthClientId(),
      redirect_uri: osmOAuthRedirectUri(),
      scope: 'read_prefs write_api',
      url: osmAuthUrl(),
      apiUrl: osmApiUrl(),
      auto: false,
    })
  }
  return client
}

export function osmAuthAuthenticated() {
  return getOsmAuth()?.authenticated() ?? false
}

export function logoutOsmAuth() {
  getOsmAuth()?.logout()
}

function errorFromUnknown(err: unknown) {
  if (err instanceof Error) return err
  if (typeof err === 'string') return new Error(err)
  return new Error('OpenStreetMap request failed')
}

export function authenticateOsm(): Promise<void> {
  const auth = getOsmAuth()
  if (!auth) return Promise.reject(new Error('OpenStreetMap posting is not configured'))
  if (auth.authenticated()) return Promise.resolve()
  return new Promise((resolve, reject) => {
    auth.authenticate((err: unknown) => {
      if (err) reject(errorFromUnknown(err))
      else resolve()
    })
  })
}

export function postOsmChangesetComment(changesetId: number, text: string): Promise<void> {
  const auth = getOsmAuth()
  if (!auth) return Promise.reject(new Error('OpenStreetMap posting is not configured'))
  return authenticateOsm().then(
    () =>
      new Promise((resolve, reject) => {
        auth.xhr(
          {
            method: 'POST',
            path: `/api/0.6/changeset/${changesetId}/comment`,
            content: new URLSearchParams({ text }).toString(),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          },
          (err: unknown) => {
            if (err) reject(errorFromUnknown(err))
            else resolve()
          },
        )
      }),
  )
}

export function fetchOsmUsername(): Promise<string | null> {
  const auth = getOsmAuth()
  if (!auth?.authenticated()) return Promise.resolve(null)
  return new Promise((resolve) => {
    auth.xhr({ method: 'GET', path: '/api/0.6/user/details' }, (err: unknown, xml: unknown) => {
      if (err || xml == null || typeof xml === 'string') {
        resolve(null)
        return
      }
      const display = (xml as Document).querySelector('user')?.getAttribute('display_name')
      resolve(display ?? null)
    })
  })
}
