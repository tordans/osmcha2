import 'server-only' // https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment

import { OsmChaAoi } from '@app/(map)/_data/OsmChaAoi.zod'
import { writeDebugFile } from '@app/(map)/_data/writeDebugFile'
import { ParamAoi } from './ParamAoi.zod'
import { searchParamsCache } from './searchParams'

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
