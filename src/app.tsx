import { useEffect } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router'
import { useAppHeight } from './hooks/useAppHeight.ts'
import { useAuthStore } from './stores/authStore.ts'
import { takeAuthTokenFromSearch } from './utils/auth.ts'
import { About } from './views/about.tsx'
import { Authorized } from './views/authorized.tsx'
import { Changeset } from './views/changeset.tsx'
import { ChangesetsList } from './views/changesets_list.tsx'
import { EditMappingTeam } from './views/edit_team.tsx'
import { Filters } from './views/filters.tsx'
import { Home } from './views/home.tsx'
import { NavbarSidebar } from './views/navbar_sidebar.tsx'
import { SavedFilters } from './views/saved_filters.tsx'
import { MappingTeams } from './views/teams.tsx'
import { TrustedUsers } from './views/trusted_users.tsx'
import { User } from './views/user.tsx'
import { Watchlist } from './views/watchlist.tsx'

export const App = () => {
  const location = useLocation()
  const navigate = useNavigate()
  useAppHeight()

  useEffect(() => {
    // add a class for the current route to the body, so that CSS selectors can
    // target elements only on specific routes if necessary
    const route = location.pathname.split('/')[1] || 'home'
    document.body.className = `route-${route}`
    return () => {
      document.body.className = ''
    }
  }, [location])

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
    <div className="app-layout">
      <div className="app-sidebar">
        <NavbarSidebar />
        <ChangesetsList />
      </div>
      <div className="app-main">
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
      </div>
    </div>
  )
}
