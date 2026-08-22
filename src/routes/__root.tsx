import { HotkeysProvider } from '@tanstack/react-hotkeys'
import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet, redirect } from '@tanstack/react-router'
import { MotionConfig } from 'motion/react'
import { TanStackAppDevtools } from '../components/shared/devtools/TanStackAppDevtools.tsx'
import { useAppHeight } from '../hooks/useAppHeight.ts'
import { useBookmarkletAuthHandoff } from '../hooks/useBookmarkletAuthHandoff.ts'
import { AppShell } from '../layout/AppShell.tsx'
import { PanePresence } from '../layout/PanePresence.tsx'
import { aoiQueryOptions } from '../query/options/aoi.ts'
import { changesetsPageQueryOptions } from '../query/options/changesetsPage.ts'
import { filtersFromSearch, migrateLegacyFilterSearch } from '../routing/filterSearch.ts'
import { routerSearch } from '../routing/routerSearch.ts'
import { EMPTY_FILTERS, osmchaSearchSchema } from '../routing/searchSchemas.ts'
import { useAuthStore } from '../stores/authStore.ts'
import { getListPaneOpen } from '../stores/list-pane-store.ts'
import { parseTokenPaste } from '../utils/auth.ts'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  validateSearch: osmchaSearchSchema,
  loaderDeps: ({ search }) => ({
    filters: filtersFromSearch(search),
    aoi: search.aoi,
    page: search.page,
  }),
  beforeLoad: ({ location, search }) => {
    const { pathname, searchStr, hash } = location
    if (pathname.length > 1 && pathname.endsWith('/')) {
      const stripped = pathname.replace(/\/+$/, '') || '/'
      throw redirect({
        href: `${stripped}${searchStr}${hash ? `#${hash}` : ''}`,
        replace: true,
      })
    }

    const rawToken = search.token?.trim()
    if (rawToken) {
      const token = parseTokenPaste(rawToken)
      if (token) {
        useAuthStore.getState().setToken(token)
      }
      throw redirect({
        search: (prev) => ({ ...prev, token: undefined }),
        replace: true,
      })
    }

    // OSM returns to `/authorized?code=&state=`. If those params land on any
    // other path (legacy filter migration used to bounce `/authorized` → `/`),
    // send them to the exchange route instead of leaving a dead code in the URL.
    const oauthCode = search.code?.trim()
    if (oauthCode && pathname !== '/authorized') {
      throw redirect({
        href: `/authorized${searchStr}${hash ? `#${hash}` : ''}`,
        replace: true,
      })
    }

    const migrated = migrateLegacyFilterSearch(pathname, search)
    if (migrated) {
      const qs = routerSearch.stringify(migrated.search)
      const nextSearch = qs === '' || qs.startsWith('?') ? qs : `?${qs}`
      throw redirect({
        href: `${migrated.pathname}${nextSearch}${hash ? (hash.startsWith('#') ? hash : `#${hash}`) : ''}`,
        replace: true,
      })
    }
  },
  loader: ({ context, deps }) => {
    const token = useAuthStore.getState().token
    if (!token) return
    // List/AOI queries are for the sidebar. Skip while it is collapsed (changeset
    // deep links start that way); hover-prefetch on the expand control warms them.
    if (!getListPaneOpen()) return

    const pageIndex = deps.page - 1
    // Do not await: blocking kept the filter menu on the previous selection until
    // the list request finished. Prefetch still warms the query cache.
    void context.queryClient
      .ensureQueryData(
        changesetsPageQueryOptions({
          pageIndex,
          filters: deps.filters ?? EMPTY_FILTERS,
          aoiId: deps.aoi ?? null,
        }),
      )
      .catch(() => {
        // useChangesetsPage surfaces the error; avoid an unhandled rejection.
      })

    if (deps.aoi) {
      void context.queryClient.ensureQueryData(aoiQueryOptions(deps.aoi)).catch(() => {
        // useAOI surfaces the error; avoid an unhandled rejection.
      })
    }
  },
  component: RootLayout,
})

function RootLayout() {
  useAppHeight()
  useBookmarkletAuthHandoff()

  return (
    <MotionConfig reducedMotion="user">
      <HotkeysProvider
        defaultOptions={{
          hotkey: {
            ignoreInputs: true,
            preventDefault: true,
            conflictBehavior: 'replace',
          },
        }}
      >
        <AppShell>
          <PanePresence>
            <Outlet />
          </PanePresence>
          <TanStackAppDevtools />
        </AppShell>
      </HotkeysProvider>
    </MotionConfig>
  )
}
