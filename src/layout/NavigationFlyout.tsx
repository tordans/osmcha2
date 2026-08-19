import { ChevronDownIcon } from '@heroicons/react/16/solid'
import { useQueryClient } from '@tanstack/react-query'
import { getRouteApi, useMatch } from '@tanstack/react-router'
import clsx from 'clsx'
import type { ReactNode } from 'react'
import { TokenImport } from '../components/token_import.tsx'
import { Avatar } from '../components/ui/avatar.tsx'
import {
  chromeDropdownMenuClassName,
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownHeading,
  DropdownItem,
  DropdownMenu,
} from '../components/ui/dropdown.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import { useFilters } from '../hooks/useFilters.ts'
import { getAuthUrl } from '../network/auth.ts'
import { useAuthStore } from '../stores/authStore.ts'
import { isOsmOAuthHost } from '../utils/auth.ts'
import { Logo } from './Logo.tsx'

const rootRouteApi = getRouteApi('__root__')

type UserData = {
  username?: string
  uid?: string | number
  avatar?: string
}

export function ChromeHeader() {
  return (
    <header className="flex shrink-0 items-center justify-between gap-2 py-1 pt-[max(0.25rem,env(safe-area-inset-top))] pr-0 pl-1">
      <Logo />
      <NavigationMenu />
    </header>
  )
}

function NavigationMenu() {
  const { token, user } = useAuth()
  const currentUser = user as UserData | undefined
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const queryClient = useQueryClient()
  const navigate = rootRouteApi.useNavigate()
  const pathname = useMatch({ strict: false, shouldThrow: false })?.pathname ?? '/'
  const search = rootRouteApi.useSearch()
  const { filters, aoiId } = useFilters()

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
    void navigate({ to: '/' })
  }

  const goMyChangesets = () => {
    if (uid == null) return
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

  const goTo = (
    to: '/' | '/about' | '/saved-filters' | '/user' | '/teams' | '/trusted-users' | '/watchlist',
  ) => {
    void navigate({ to, search })
  }

  const isRecent = pathname === '/' && !aoiId && !filters?.uids && !filters?.checked_by
  const isMyChangesets =
    pathname === '/' && uid != null && String(filters?.uids?.[0]?.value) === String(uid)
  const isMyReviews =
    pathname === '/' && Boolean(username) && filters?.checked_by?.[0]?.value === username

  const initials = username?.slice(0, 2).toUpperCase()

  return (
    <Dropdown backdrop className="shrink-0">
      <DropdownButton
        outline
        aria-label="Menu"
        data-panel-origin="menu"
        className="group relative z-[110] h-9 min-h-9"
      >
        Menu
        <ChevronDownIcon
          data-slot="icon"
          className="transition duration-200 group-data-open:rotate-180"
        />
      </DropdownButton>
      <DropdownMenu anchor="bottom end" className={chromeDropdownMenuClassName}>
        <DropdownHeading>Changesets</DropdownHeading>
        <NavItem current={isRecent} onClick={() => goTo('/')}>
          Recent
        </NavItem>
        {token && uid != null && (
          <NavItem current={isMyChangesets} onClick={goMyChangesets}>
            My Changesets
          </NavItem>
        )}
        {token && username && (
          <NavItem current={isMyReviews} onClick={goMyReviews}>
            My Reviews
          </NavItem>
        )}
        <NavItem current={pathname === '/saved-filters'} onClick={() => goTo('/saved-filters')}>
          Saved filters
        </NavItem>

        <DropdownDivider />
        <DropdownHeading>About</DropdownHeading>
        <NavItem current={pathname === '/about'} onClick={() => goTo('/about')}>
          About
        </NavItem>

        <DropdownDivider />
        <DropdownHeading>Account</DropdownHeading>
        {token && (
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar src={currentUser?.avatar} initials={initials} alt="" className="size-7" />
            <span className="text-sm/5 font-medium text-zinc-950">{username || 'Signed in'}</span>
          </div>
        )}
        <NavItem current={pathname === '/user'} onClick={() => goTo('/user')}>
          Account
        </NavItem>
        <NavItem current={pathname.startsWith('/teams')} onClick={() => goTo('/teams')}>
          Teams
        </NavItem>
        <NavItem current={pathname === '/trusted-users'} onClick={() => goTo('/trusted-users')}>
          Trusted users
        </NavItem>
        <NavItem current={pathname === '/watchlist'} onClick={() => goTo('/watchlist')}>
          Watchlist
        </NavItem>
        {token ? (
          <NavItem onClick={handleLogout}>Sign out</NavItem>
        ) : isOsmOAuthHost() ? (
          <NavItem onClick={handleLoginClick}>Sign in</NavItem>
        ) : (
          <div className="px-2 py-2">
            <TokenImport compact />
          </div>
        )}
      </DropdownMenu>
    </Dropdown>
  )
}

function NavItem({
  current,
  onClick,
  children,
}: {
  current?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <DropdownItem
      onClick={onClick}
      className={clsx('cursor-pointer', current && 'bg-zinc-950/5 font-medium')}
    >
      {children}
    </DropdownItem>
  )
}
