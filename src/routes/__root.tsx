import { HotkeysProvider } from '@tanstack/react-hotkeys'
import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet, redirect } from '@tanstack/react-router'
import { TanStackAppDevtools } from '../components/shared/devtools/TanStackAppDevtools.tsx'
import { useAppHeight } from '../hooks/useAppHeight.ts'
import { AppShell } from '../layout/AppShell.tsx'
import { aoiQueryOptions } from '../query/options/aoi.ts'
import { changesetsPageQueryOptions } from '../query/options/changesetsPage.ts'
import { osmchaSearchSchema } from '../routing/searchSchemas.ts'
import { useAuthStore } from '../stores/authStore.ts'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  validateSearch: osmchaSearchSchema,
  loaderDeps: ({ search }) => ({
    filters: search.filters,
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

    const token = search.token?.trim()
    if (token) {
      useAuthStore.getState().setToken(token)
      throw redirect({
        search: (prev) => ({ ...prev, token: undefined }),
        replace: true,
      })
    }
  },
  loader: async ({ context, deps }) => {
    const token = useAuthStore.getState().token
    if (!token) return

    const pageIndex = deps.page - 1
    await context.queryClient.ensureQueryData(
      changesetsPageQueryOptions({
        pageIndex,
        filters: deps.filters ?? {},
        aoiId: deps.aoi ?? null,
      }),
    )

    if (deps.aoi) {
      await context.queryClient.ensureQueryData(aoiQueryOptions(deps.aoi))
    }
  },
  component: RootLayout,
})

function RootLayout() {
  useAppHeight()

  return (
    <HotkeysProvider
      defaultOptions={{
        hotkey: {
          ignoreInputs: true,
          preventDefault: true,
        },
      }}
    >
      <AppShell>
        <Outlet />
        <TanStackAppDevtools />
      </AppShell>
    </HotkeysProvider>
  )
}
