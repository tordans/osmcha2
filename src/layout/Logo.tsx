import { Link, getRouteApi } from '@tanstack/react-router'

const rootRouteApi = getRouteApi('__root__')

export function Logo() {
  const search = rootRouteApi.useSearch()

  return (
    <Link
      to="/"
      search={search}
      className="cursor-pointer touch-manipulation px-2 text-base font-semibold text-zinc-600 select-none"
    >
      <span className="text-blue-600">OSM</span>Cha
    </Link>
  )
}
