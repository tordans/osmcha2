import { NextAuthConfig } from 'next-auth'

export const nextAuthOsmProvider: NextAuthConfig['providers'][number] = {
  id: 'osmcha2',
  name: 'OSMCha2',
  type: 'oidc',
  issuer: 'https://www.openstreetmap.org',
  token: 'https://www.openstreetmap.org/oauth2/token',
  authorization: {
    url: 'https://www.openstreetmap.org/oauth2/authorize',
    params: { scope: 'openid' },
  },
  // Note: No `userinfo` are fetched during oAuth, only the OSM UserID is known. Using the `profile` property does not help.
  userinfo: 'https://www.openstreetmap.org/oauth2/userinfo',
  clientId: process.env.OSMCHA_CLIENT_ID,
  clientSecret: process.env.OSMCHA_CLIENT_SECRET,
}
