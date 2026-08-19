import * as Headless from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/20/solid'
import { useQueryClient } from '@tanstack/react-query'
import { getRouteApi, useMatch } from '@tanstack/react-router'
import { useState } from 'react'
import { TokenImport } from '../components/token_import.tsx'
import { Avatar } from '../components/ui/avatar.tsx'
import { Button } from '../components/ui/button.tsx'
import {
  Sidebar,
  SidebarBody,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from '../components/ui/sidebar.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import { useFilters } from '../hooks/useFilters.ts'
import { getAuthUrl } from '../network/auth.ts'
import { useAllAOIs } from '../query/hooks/useAOI.ts'
import { useAuthStore } from '../stores/authStore.ts'
import { isOsmOAuthHost } from '../utils/auth.ts'
import { Logo } from './Logo.tsx'

const rootRouteApi = getRouteApi('__root__')

type UserData = {
  username?: string
  uid?: string | number
  avatar?: string
}

type AoiFeature = {
  id: string | number
  properties?: { name?: string }
}

function aoiFeatures(data: unknown): AoiFeature[] {
  if (!data) return []
  if (Array.isArray(data)) return data as AoiFeature[]
  if (typeof data === 'object' && data !== null && 'features' in data) {
    const features = (data as { features: unknown }).features
    if (Array.isArray(features)) return features as AoiFeature[]
  }
  return []
}

export function ChromeHeader() {
  const pathname = useMatch({ strict: false, shouldThrow: false })?.pathname ?? '/'
  const search = rootRouteApi.useSearch()
  const locationKey = `${pathname}?${JSON.stringify(search)}`
  const [openFor, setOpenFor] = useState<string | null>(null)
  const open = openFor === locationKey

  return (
    <>
      <header className="flex shrink-0 items-center justify-between gap-2 px-1 py-1 pt-[max(0.25rem,env(safe-area-inset-top))]">
        <Logo />
        <Button
          plain
          aria-label="Open menu"
          onClick={() => setOpenFor(locationKey)}
          className="h-8 min-h-8 cursor-pointer touch-manipulation items-center px-2 py-0 select-none"
        >
          <Bars3Icon data-slot="icon" className="size-5" />
          Menu
        </Button>
      </header>
      <NavigationFlyout open={open} onClose={() => setOpenFor(null)} />
    </>
  )
}

function NavigationFlyout({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { token, user } = useAuth()
  const currentUser = user as UserData | undefined
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const queryClient = useQueryClient()
  const navigate = rootRouteApi.useNavigate()
  const pathname = useMatch({ strict: false, shouldThrow: false })?.pathname ?? '/'
  const search = rootRouteApi.useSearch()
  const { filters, aoiId } = useFilters()
  const aoisQuery = useAllAOIs()
  const aois = aoiFeatures(aoisQuery.data)

  const username = currentUser?.username
  const uid = currentUser?.uid

  const handleLoginClick = () => {
    if (!isOsmOAuthHost()) return
    void getAuthUrl().then((res) => {
      window.location.assign(res.auth_url)
    })
  }

  const handleLogout = () => {
    clearAuth()
    queryClient.clear()
    onClose()
    void navigate({ to: '/' })
  }

  const goMyChangesets = () => {
    if (uid == null) return
    onClose()
    void navigate({
      to: '/',
      search: {
        filters: {
          uids: [{ label: String(uid), value: String(uid) }],
          date__gte: [{ label: '', value: '' }],
        },
        page: undefined,
      },
    })
  }

  const goMyReviews = () => {
    if (!username) return
    onClose()
    void navigate({
      to: '/',
      search: {
        filters: {
          checked_by: [{ label: username, value: username }],
          date__gte: [{ label: '', value: '' }],
        },
        page: undefined,
      },
    })
  }

  const goAoi = (id: string | number) => {
    onClose()
    void navigate({
      to: '/',
      search: {
        aoi: String(id),
        filters: undefined,
        page: undefined,
      },
    })
  }

  const goTo = (
    to: '/' | '/about' | '/saved-filters' | '/user' | '/teams' | '/trusted-users' | '/watchlist',
  ) => {
    onClose()
    void navigate({ to, search })
  }

  const isRecent = pathname === '/' && !aoiId && !filters?.uids && !filters?.checked_by
  const isMyChangesets =
    pathname === '/' && uid != null && String(filters?.uids?.[0]?.value) === String(uid)
  const isMyReviews =
    pathname === '/' && Boolean(username) && filters?.checked_by?.[0]?.value === username

  const initials = username?.slice(0, 2).toUpperCase()

  return (
    <Headless.Dialog open={open} onClose={onClose} className="relative z-50">
      <Headless.DialogBackdrop
        transition
        className="fixed inset-0 bg-black/30 transition data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />
      <Headless.DialogPanel
        transition
        className="fixed inset-y-0 left-0 w-full max-w-80 p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pl-[max(0.5rem,env(safe-area-inset-left))] transition duration-300 ease-in-out data-closed:-translate-x-full"
      >
        <div className="flex h-full flex-col rounded-lg bg-white shadow-sm ring-1 ring-zinc-950/5">
          <div className="flex items-center justify-between gap-3 px-4 pt-3">
            <Logo />
            <Headless.CloseButton
              as={Button}
              plain
              aria-label="Close menu"
              className="min-h-11 min-w-11 cursor-pointer touch-manipulation select-none"
            >
              <XMarkIcon data-slot="icon" className="size-5" />
            </Headless.CloseButton>
          </div>
          <Sidebar className="min-h-0 flex-1">
            <SidebarBody>
              <SidebarSection>
                <SidebarHeading>Changesets</SidebarHeading>
                <SidebarItem onClick={() => goTo('/')} current={isRecent}>
                  <SidebarLabel>Recent</SidebarLabel>
                </SidebarItem>
                {token && uid != null && (
                  <SidebarItem onClick={goMyChangesets} current={isMyChangesets}>
                    <SidebarLabel>My Changesets</SidebarLabel>
                  </SidebarItem>
                )}
                {token && username && (
                  <SidebarItem onClick={goMyReviews} current={isMyReviews}>
                    <SidebarLabel>My Reviews</SidebarLabel>
                  </SidebarItem>
                )}
                {aois.map((aoi) => (
                  <SidebarItem
                    key={aoi.id}
                    onClick={() => goAoi(aoi.id)}
                    current={aoiId === String(aoi.id)}
                  >
                    <SidebarLabel>{aoi.properties?.name || `Filter ${aoi.id}`}</SidebarLabel>
                  </SidebarItem>
                ))}
                <SidebarItem
                  onClick={() => goTo('/saved-filters')}
                  current={pathname === '/saved-filters'}
                >
                  <SidebarLabel>Saved filters</SidebarLabel>
                </SidebarItem>
              </SidebarSection>

              <SidebarSection>
                <SidebarHeading>About</SidebarHeading>
                <SidebarItem onClick={() => goTo('/about')} current={pathname === '/about'}>
                  <SidebarLabel>About</SidebarLabel>
                </SidebarItem>
              </SidebarSection>

              <SidebarSection>
                <SidebarHeading>Account</SidebarHeading>
                {token && (
                  <div className="mb-1 flex items-center gap-3 px-2 py-2">
                    <Avatar
                      src={currentUser?.avatar}
                      initials={initials}
                      alt=""
                      className="size-7"
                    />
                    <SidebarLabel className="text-sm/5 font-medium text-zinc-950">
                      {username || 'Signed in'}
                    </SidebarLabel>
                  </div>
                )}
                <SidebarItem onClick={() => goTo('/user')} current={pathname === '/user'}>
                  <SidebarLabel>Account</SidebarLabel>
                </SidebarItem>
                <SidebarItem onClick={() => goTo('/teams')} current={pathname.startsWith('/teams')}>
                  <SidebarLabel>Teams</SidebarLabel>
                </SidebarItem>
                <SidebarItem
                  onClick={() => goTo('/trusted-users')}
                  current={pathname === '/trusted-users'}
                >
                  <SidebarLabel>Trusted users</SidebarLabel>
                </SidebarItem>
                <SidebarItem onClick={() => goTo('/watchlist')} current={pathname === '/watchlist'}>
                  <SidebarLabel>Watchlist</SidebarLabel>
                </SidebarItem>
                {token ? (
                  <SidebarItem onClick={handleLogout}>
                    <SidebarLabel>Sign out</SidebarLabel>
                  </SidebarItem>
                ) : isOsmOAuthHost() ? (
                  <SidebarItem onClick={handleLoginClick}>
                    <SidebarLabel>Sign in</SidebarLabel>
                  </SidebarItem>
                ) : (
                  <div className="px-2 py-2">
                    <TokenImport compact />
                  </div>
                )}
              </SidebarSection>
            </SidebarBody>
          </Sidebar>
        </div>
      </Headless.DialogPanel>
    </Headless.Dialog>
  )
}
