import { createRouter } from '@tanstack/react-router'
import { queryClient } from './query/client.ts'
import { routeTree } from './routeTree.gen.ts'
import { routerSearch } from './routing/routerSearch.ts'

const baseUrl = import.meta.env.BASE_URL
const basepath =
  baseUrl === '/' ? undefined : baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl

export const router = createRouter({
  routeTree,
  basepath,
  trailingSlash: 'never',
  parseSearch: routerSearch.parse,
  stringifySearch: routerSearch.stringify,
  defaultPreload: 'intent',
  // Query owns staleness via ensureQueryData — do not skip loaders from the router.
  defaultPreloadStaleTime: 0,
  context: { queryClient },
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
