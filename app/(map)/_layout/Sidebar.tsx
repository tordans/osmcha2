import { OsmChaChangesets } from '../_components/Changeset/zod/OsmChaChangesets.zod'
import { writeDebugFile } from '../_components/Changeset/zod/writeDebugFile'
import { SidebarChangeset } from './SidebarChangeset'

export const Sidebar = async () => {
  const rawOsmChaChangesetsResponse = await fetch(
    'https://osmcha.org/api/v1/changesets/?page=1&page_size=25&date__gte=2024-05-27&date__lte=2024-05-29%2019%3A41',
    { headers: { Authorization: `Token ${process.env.NEXT_PUBLIC_TEMPORARY_USER_TOKE}` } },
  )
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
