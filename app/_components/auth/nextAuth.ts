import NextAuth, { NextAuthConfig } from 'next-auth'
import { nextAuthOsmProvider } from './nextAuthOsmProvider'

export const BASE_PATH = '/api/auth'
const OAUTH_DEBUG = false
const debugLog = (...input: any[]) => OAUTH_DEBUG && console.info('OAUTH DEBUG:', input)

const authOptions: NextAuthConfig = {
  debug: OAUTH_DEBUG,
  providers: [nextAuthOsmProvider],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access token and/or the user ID to the token immediately after sign-in.
      // The JWT method is called multiple times, but only the first call includes the account and profile properties.
      // We ensure that the information is passed only once; it will be available via `token` in subsequent calls.
      if (account?.access_token) {
        token.accessToken = account.access_token
        debugLog('Setting `token.accessToken = account.access_token`')
      }
      if (profile?.sub) {
        token.userId = profile.sub
        debugLog('Setting `token.userId = profile.sub`')
      }
      debugLog('JWT token', token)
      return token
    },
    async session({ session, token }) {
      // We use jwt() to pass data from the account and profile to the token.
      // We can then pass it over to the session.
      // From here, we can access it via `const session = await auth()`
      // Docs https://github.com/nextauthjs/next-auth/blob/main/docs/pages/guides/integrating-third-party-backends.mdx#storing-the-token-in-the-session
      // @ts-expect-error TS complains, but it works
      session.user.id = token.userId
      // @ts-expect-error TS complains, but it works
      session.accessToken = token.accessToken
      debugLog('SESSION session', session)
      return session
    },
  },
  basePath: BASE_PATH,
  secret: process.env.NEXTAUTH_SECRET,
}

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)
