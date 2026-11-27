import { afterEach, describe, expect, it, vi } from 'vitest'
import { canUseOsmAuthFromThisBuild, isOsmSandboxAuth } from './osmAuthConfig.ts'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('canUseOsmAuthFromThisBuild', () => {
  it('is off without a client id', () => {
    vi.stubEnv('VITE_OSM_OAUTH_CLIENT_ID', '')
    expect(canUseOsmAuthFromThisBuild()).toBe(false)
  })

  it('never lets a dev build post to openstreetmap.org', () => {
    vi.stubEnv('DEV', true)
    vi.stubEnv('VITE_OSM_OAUTH_CLIENT_ID', 'id')
    vi.stubEnv('VITE_OSM_AUTH_URL', 'https://www.openstreetmap.org')
    expect(isOsmSandboxAuth()).toBe(false)
    expect(canUseOsmAuthFromThisBuild()).toBe(false)
  })

  it('lets a dev build post to the sandbox', () => {
    vi.stubEnv('DEV', true)
    vi.stubEnv('VITE_OSM_OAUTH_CLIENT_ID', 'id')
    vi.stubEnv('VITE_OSM_AUTH_URL', 'https://master.apis.dev.openstreetmap.org/')
    expect(canUseOsmAuthFromThisBuild()).toBe(true)
  })

  it('lets a production build post to openstreetmap.org', () => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_OSM_OAUTH_CLIENT_ID', 'id')
    vi.stubEnv('VITE_OSM_AUTH_URL', '')
    expect(canUseOsmAuthFromThisBuild()).toBe(true)
  })
})
