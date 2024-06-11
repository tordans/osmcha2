import { OsmChaChangesets } from '../_components/Changeset/zod/OsmChaChangesets.zod'
import { writeDebugFile } from '../_components/Changeset/zod/writeDebugFile'
import { ParamFilters } from './ParamFilters.zod'
import { ParamOrderBy } from './ParamOrderBy.zod'
import { ParamPage } from './ParamPage.zod copy'
import { SidebarChangeset } from './SidebarChangeset'
import { searchParamsCache } from './searchParams'

export const Sidebar = async () => {
  const filters = ParamFilters.parse(searchParamsCache.get('filters'))
  const orderBy = ParamOrderBy.parse(searchParamsCache.get('orderBy'))
  const page = ParamPage.parse(searchParamsCache.get('page')) || 1

  const apiUrl = new URL('https://osmcha.org/api/v1/changesets/')
  apiUrl.searchParams.set('page', String(page))
  apiUrl.searchParams.set('page_size', '25')
  orderBy && apiUrl.searchParams.set('orderBy', orderBy)
  filters.checked_by &&
    apiUrl.searchParams.set('checked_by', filters.checked_by.map((f) => f.value).join(','))
  // Object.entries(filters).forEach(([key, value]) => {
  //   apiUrl.searchParams.set(key, JSON.stringify(value))
  // })

  // https://osmcha.org/api/v1/changesets/?page=1&page_size=25&checked_by=tordans&date__lte=2024-06-11%2005%3A19
  // '/?filters={"checked_by":[{"label":"tordans","value":"tordans"}],"date__gte":[{"label":"","value":""}]}'
  // 'https://osmcha.org/api/v1/changesets/?page=1&page_size=25&checked_by=tordans,Supaplex030&date__lte=2024-06-11 05:36'

  // TODO: Add some error handling for errors like a 500 due to mailformed params
  console.info('Fetching', apiUrl.toString())
  const rawOsmChaChangesetsResponse = await fetch(apiUrl.toString(), {
    headers: { Authorization: `Token ${process.env.NEXT_PUBLIC_TEMPORARY_USER_TOKE}` },
  })
  const osmChaRealchangesetsRaw = await rawOsmChaChangesetsResponse.json()
  writeDebugFile({
    parser: OsmChaChangesets,
    data: osmChaRealchangesetsRaw,
    filename: 'osmChaRealchangesetsRaw',
  })
  const osmChaChangeset = OsmChaChangesets.parse(osmChaRealchangesetsRaw)

  return (
    <nav className="group/nav h-full overflow-y-scroll">
      <ul className="divide-y divide-gray-100">
        {osmChaChangeset.features.map((changeset) => {
          return <SidebarChangeset key={changeset.id} changeset={changeset} />
        })}
      </ul>
    </nav>
  )
}
