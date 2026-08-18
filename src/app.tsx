import { useEffect } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router'
import { useAppHeight } from './hooks/useAppHeight.ts'
import { AppShell } from './layout/AppShell.tsx'
import { useAuthStore } from './stores/authStore.ts'
import { takeAuthTokenFromSearch } from './utils/auth.ts'
import { About } from './views/about.tsx'
import { Authorized } from './views/authorized.tsx'
import { Changeset } from './views/changeset.tsx'
import { EditMappingTeam } from './views/edit_team.tsx'
import { Filters } from './views/filters.tsx'
import { Home } from './views/home.tsx'
import { SavedFilters } from './views/saved_filters.tsx'
import { MappingTeams } from './views/teams.tsx'
import { TrustedUsers } from './views/trusted_users.tsx'
import { User } from './views/user.tsx'
import { Watchlist } from './views/watchlist.tsx'

export const App = () => {
  const location = useLocation()
  const navigate = useNavigate()
  useAppHeight()

  useEffect(
    function consumeAuthTokenQueryParam() {
      const result = takeAuthTokenFromSearch(location.search)
      if (!result) return
      useAuthStore.getState().setToken(result.token)
      void navigate(
        { pathname: location.pathname, search: result.nextSearch, hash: location.hash },
        { replace: true },
      )
    },
    [location.hash, location.pathname, location.search, navigate],
  )

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/filters" element={<Filters />} />
        <Route path="/changesets/:id" element={<Changeset />} />
        <Route path="/about" element={<About />} />
        <Route path="/user" element={<User />} />
        <Route path="/teams" element={<MappingTeams />} />
        <Route path="/teams/:id" element={<EditMappingTeam />} />
        <Route path="/saved-filters" element={<SavedFilters />} />
        <Route path="/trusted-users" element={<TrustedUsers />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/authorized" element={<Authorized />} />
      </Routes>
    </AppShell>
  )
}
