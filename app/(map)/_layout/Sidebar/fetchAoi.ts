import { OsmChaAoi, TOsmChaAoi } from '../../_components/Changeset/zod/OsmChaAoi.zod'
import { writeDebugFile } from '../../_components/Changeset/zod/writeDebugFile'
import { ParamAoi } from '../ParamAoi.zod'
import { searchParamsCache } from '../searchParams'

export const fetchAoi = async () => {
  const aoi = ParamAoi.parse(searchParamsCache.get('aoi'))

  let osmChaAoi: TOsmChaAoi | undefined = undefined
  if (aoi) {
    const osmChaAoiApiUrl = `https://osmcha.org/api/v1/aoi/${aoi}`
    console.info('Fetching', osmChaAoiApiUrl)
    const rawOsmChaAoiResponse = await fetch(osmChaAoiApiUrl, {
      headers: { Authorization: `Token ${process.env.NEXT_PUBLIC_TEMPORARY_USER_TOKE}` },
    })
    const OsmChaAoiRaw = await rawOsmChaAoiResponse.json()
    writeDebugFile({
      parser: OsmChaAoi,
      data: OsmChaAoiRaw,
      filename: 'OsmChaAoiRaw',
    })
    osmChaAoi = OsmChaAoi.parse(OsmChaAoiRaw)
  }
  return osmChaAoi
}
