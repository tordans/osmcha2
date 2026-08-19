import { getRouteApi } from '@tanstack/react-router'
import { RouterLink } from '../routing/RouterLink.tsx'

const rootRouteApi = getRouteApi('__root__')

export function Logo() {
  const search = rootRouteApi.useSearch()

  return (
    <RouterLink
      to="/"
      search={search}
      className="cursor-pointer touch-manipulation px-2 text-base font-semibold text-zinc-600 select-none"
    >
      <span className="text-blue-600">OSM</span>Cha
    </RouterLink>
  )
}
