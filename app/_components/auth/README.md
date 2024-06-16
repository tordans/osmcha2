# General setup

- We use the NextJS `middleware.ts` to check if a session exists. All non-logged in users are redirected to a info + SignIn page
- We store the OSM userId as `session.user.id` and the Bearer token in `session.accessToken`.
- We can access this using the NextAuth helper from any client and server component.
- Use `OAUTH_DEBUG` to show details on the auth in terminal
- The oAuth app on osm.org requires those redirect paths (for `npm run dev` and `npm run start`)
  ```
  https://osmcha2.test:3000/api/auth/callback/osmcha2
  https://osmcha2.test:5173/api/auth/callback/osmcha2
  ```

# Some notes from the journey to get NextAuth working with OSM…

- This uses NextAuth 5 (Beta) which is optimized to be used with React Server Components.
  - V4 https://next-auth.js.org/
  - V5 https://github.com/nextauthjs/next-auth
- Unfortunatelly there is no official OSM Provider, yet, so we have to hand craft that

**Workarounds:**

- This only started working once I used `type: 'oidc'` instead of `oauth`. No idea why. `oauth` returns some token error and does not finish.
- For some reason the provider did not pick up the URLs from the `wellKnown` prop that atlas-app and osm-teams use, so I had to pass them manually.
- For some reasons next auth does not populate the user object. We do this manually for `atlas-app` but that did not work either. We will to it outside of the oauth process in a server component…
- openstreetmap.org does not allow `localhost` as redirect URLs (see https://github.com/openstreetmap/openstreetmap-website/issues/3613) so we start the next server with 127.0.0.1. But some part of the process rewrites that to localhost, so it fails. To work around we now user osmcha2.test as test domain which works. An alternative solution seems to be to use the `redirectProxyUrl` but I did not look into this anymore.

**Docs:**

How to pass data from `callbacks.jwt` to `calbacks.session`:

- See code comments in our implementation
- Docs https://github.com/nextauthjs/next-auth/blob/main/docs/pages/guides/integrating-third-party-backends.mdx#storing-the-token-in-the-session
- Docs https://github.com/nextauthjs/next-auth/blob/main/docs/pages/guides/extending-the-session.mdx#with-jwt

**Others:**

- Jack Herrington has a great tutorial on using NextAuth 5 + NextJS
  - Code https://github.com/jherr/next-auth-v5/
  - YouTube: https://www.youtube.com/watch?v=z2A9P1Zg1WM
- `atlas-app` uses NextAuth Version4 inside of BlitzJS which makes it work a bit different https://github.com/FixMyBerlin/atlas-app/blob/develop/src/pages/api/auth/%5B...nextauth%5D.ts
- `osm-teams` uses NextAuth Version4 and the config is different from what we have here but I was not able to use it the same way they do. Either Version5 is different or IDK… https://github.com/developmentseed/osm-teams/blob/develop/src/pages/api/auth/%5B...nextauth%5D.js

**Links:**

- osm.org well-known Page https://www.openstreetmap.org/.well-known/openid-configuration
