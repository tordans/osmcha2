import { OsmChaChangesets } from '@components/zod/OsmChaChangesets.zod'
import { writeDebugFile } from '@components/zod/writeDebugFile'
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

  const apiUrl = aoi
    ? new URL(`https://osmcha.org/api/v1/aoi/${aoi}/changesets/`)
    : new URL('https://osmcha.org/api/v1/changesets/')
  apiUrl.searchParams.set('page', String(page))
  apiUrl.searchParams.set('page_size', '25')
  orderBy && apiUrl.searchParams.set('orderBy', orderBy)
  filters.harmful && apiUrl.searchParams.set('harmful', String(filters.harmful[0].value))
  filters.checked_by &&
    apiUrl.searchParams.set('checked_by', filters.checked_by.map((f) => f.value).join(','))
  filters.uids && apiUrl.searchParams.set('uids', filters.uids.map((e) => e.value).join(','))

  // TODO: Add some error handling for errors like a 500 due to mailformed params
  console.info('Fetching', apiUrl.toString())
  const rawResponse = await fetch(apiUrl.toString(), {
    headers: { Authorization: `Token ${process.env.NEXT_PUBLIC_TEMPORARY_USER_TOKE}` },
  })
  const response = await rawResponse.json()
  writeDebugFile({
    parser: OsmChaChangesets,
    data: response,
    filename: 'osmChaChangesetsRaw',
  })
  return OsmChaChangesets.parse(response)
}
