import { OsmChaChangesets } from '../../_components/Changeset/zod/OsmChaChangesets.zod'
import { writeDebugFile } from '../../_components/Changeset/zod/writeDebugFile'
import { ParamAoi } from '../ParamAoi.zod'
import { ParamFilters } from '../ParamFilters.zod'
import { ParamOrderBy } from '../ParamOrderBy.zod'
import { ParamPage } from '../ParamPage.zod'
import { searchParamsCache } from '../searchParams'

export const fetchChangesets = async () => {
  const filters = ParamFilters.parse(searchParamsCache.get('filters'))
  const orderBy = ParamOrderBy.parse(searchParamsCache.get('orderBy'))
  const page = ParamPage.parse(searchParamsCache.get('page')) || 1
  const aoi = ParamAoi.parse(searchParamsCache.get('aoi'))

  const osmChaChangesetsApiUrl = aoi
    ? new URL(`https://osmcha.org/api/v1/aoi/${aoi}/changesets/`)
    : new URL('https://osmcha.org/api/v1/changesets/')
  osmChaChangesetsApiUrl.searchParams.set('page', String(page))
  osmChaChangesetsApiUrl.searchParams.set('page_size', '25')
  orderBy && osmChaChangesetsApiUrl.searchParams.set('orderBy', orderBy)
  filters.harmful &&
    osmChaChangesetsApiUrl.searchParams.set('harmful', String(filters.harmful[0].value))
  filters.checked_by &&
    osmChaChangesetsApiUrl.searchParams.set(
      'checked_by',
      filters.checked_by.map((f) => f.value).join(','),
    )
  filters.uids &&
    osmChaChangesetsApiUrl.searchParams.set('uids', filters.uids.map((e) => e.value).join(','))
  // Object.entries(filters).forEach(([key, value]) => {
  //   apiUrl.searchParams.set(key, JSON.stringify(value))
  // })

  // https://osmcha.org/api/v1/changesets/?page=1&page_size=25&checked_by=tordans&date__lte=2024-06-11%2005%3A19
  // '/?filters={"checked_by":[{"label":"tordans","value":"tordans"}],"date__gte":[{"label":"","value":""}]}'
  // 'https://osmcha.org/api/v1/changesets/?page=1&page_size=25&checked_by=tordans,Supaplex030&date__lte=2024-06-11 05:36'

  // TODO: Add some error handling for errors like a 500 due to mailformed params
  console.info('Fetching', osmChaChangesetsApiUrl.toString())
  const rawOsmChaChangesetsResponse = await fetch(osmChaChangesetsApiUrl.toString(), {
    headers: { Authorization: `Token ${process.env.NEXT_PUBLIC_TEMPORARY_USER_TOKE}` },
  })
  const osmChaChangesetsRaw = await rawOsmChaChangesetsResponse.json()
  writeDebugFile({
    parser: OsmChaChangesets,
    data: osmChaChangesetsRaw,
    filename: 'osmChaChangesetsRaw',
  })
  return OsmChaChangesets.parse(osmChaChangesetsRaw)
}
