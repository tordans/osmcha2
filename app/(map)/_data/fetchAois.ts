import { OsmChaAois } from '@app/(map)/_data/OsmChaAois.zod'
import { writeDebugFile } from '@app/(map)/_data/writeDebugFile'

export const fetchAois = async () => {
  const apiUrl = 'https://osmcha.org/api/v1/aoi/'
  console.info('Fetching', apiUrl)
  const rawResponse = await fetch(apiUrl, {
    headers: { Authorization: `Token ${process.env.NEXT_PUBLIC_TEMPORARY_USER_TOKE}` },
  })
  const response = await rawResponse.json()
  writeDebugFile({
    parser: OsmChaAois,
    data: response,
    filename: 'OsmChaAoisRaw',
  })
  return OsmChaAois.parse(response)
}
