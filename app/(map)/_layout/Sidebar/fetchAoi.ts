import { writeDebugFile } from '@app/(map)/_components/utils/writeDebugFile'
import { OsmChaAoi } from '@components/zod/OsmChaAoi.zod'
import { ParamAoi } from '../ParamAoi.zod'
import { searchParamsCache } from '../searchParams'

export const fetchAoi = async () => {
  const aoi = ParamAoi.parse(searchParamsCache.get('aoi'))

  if (aoi) {
    const apiUrl = `https://osmcha.org/api/v1/aoi/${aoi}`
    console.info('Fetching', apiUrl)
    const rawResponse = await fetch(apiUrl, {
      headers: { Authorization: `Token ${process.env.NEXT_PUBLIC_TEMPORARY_USER_TOKE}` },
    })
    const response = await rawResponse.json()
    writeDebugFile({
      parser: OsmChaAoi,
      data: response,
      filename: 'OsmChaAoiRaw',
    })
    return OsmChaAoi.parse(response)
  }
  return undefined
}
