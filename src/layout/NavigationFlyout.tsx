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
  DropdownSection,
} from '../components/ui/dropdown.tsx'
import { ChevronDownIcon } from '../components/ui/icons.ts'
import { Text } from '../components/ui/text.tsx'
import { appVersionLabel, donateUrl, githubContributingUrl } from '../config/index.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { getAuthUrl } from '../network/auth.ts'
import { isAccountPath } from '../routing/filterSearch.ts'
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
    <header className="relative z-10 flex shrink-0 items-center justify-between gap-2 py-1 pt-[max(0.25rem,env(safe-area-inset-top))] pr-0 pl-1 min-[56rem]:pb-0">
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

  const username = currentUser?.username

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

  const goTo = (
    to: '/' | '/about' | '/saved-filters' | '/user' | '/teams' | '/trusted-users' | '/watchlist',
  ) => {
    void navigate({ to, search: isAccountPath(to) ? {} : search })
  }

  const initials = username?.slice(0, 2).toUpperCase()

  return (
    <Dropdown backdrop className="shrink-0">
      <DropdownButton
        outline
        aria-label="Menu"
        data-panel-origin="menu"
        className={clsx(
          'group relative isolate z-10 h-9 min-h-9 bg-zinc-100',
          'transition-shadow duration-200',
          'data-hover:bg-zinc-100! data-open:z-[110] data-open:bg-zinc-100!',
          'data-hover:shadow-[0_0_16px_rgb(24_24_27_/_0.16),0_4px_12px_rgb(24_24_27_/_0.08)]',
          'data-open:shadow-[0_0_16px_rgb(24_24_27_/_0.16),0_4px_12px_rgb(24_24_27_/_0.08)]',
        )}
      >
        Menu
        <ChevronDownIcon
          data-slot="icon"
          className="transition duration-200 group-data-open:rotate-180"
        />
      </DropdownButton>
      <DropdownMenu anchor="bottom end" className={chromeDropdownMenuClassName}>
        <DropdownSection>
          <DropdownHeading>Changesets</DropdownHeading>
          <NavItem current={pathname === '/saved-filters'} onClick={() => goTo('/saved-filters')}>
            Saved filters
          </NavItem>
        </DropdownSection>

        <DropdownDivider />
        <DropdownSection>
          <DropdownHeading>About</DropdownHeading>
          <NavItem current={pathname === '/about'} onClick={() => goTo('/about')}>
            Guide
          </NavItem>
          <DropdownItem
            href={githubContributingUrl}
            target="_blank"
            rel="noreferrer"
            className="cursor-pointer"
          >
            GitHub
          </DropdownItem>
          <DropdownItem
            href={donateUrl}
            target="_blank"
            rel="noreferrer"
            className="cursor-pointer"
          >
            Donate
          </DropdownItem>
        </DropdownSection>

        <DropdownDivider />
        <DropdownSection>
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
        </DropdownSection>

        <DropdownDivider />
        <DropdownSection>
          <DropdownHeading>Version</DropdownHeading>
          <Text className="col-span-full px-3.5 pb-1.5 sm:px-3">{appVersionLabel}</Text>
        </DropdownSection>
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
