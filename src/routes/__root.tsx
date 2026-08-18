import { createRootRoute, Outlet, redirect } from '@tanstack/react-router'
import { useAppHeight } from '../hooks/useAppHeight.ts'
import { AppShell } from '../layout/AppShell.tsx'
import { osmchaSearchSchema } from '../routing/searchSchemas.ts'
import { useAuthStore } from '../stores/authStore.ts'

export const Route = createRootRoute({
  validateSearch: osmchaSearchSchema,
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
  component: RootLayout,
})

function RootLayout() {
  useAppHeight()

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
