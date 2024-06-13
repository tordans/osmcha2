import 'server-only' // https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment

import { OsmChaUser } from '@app/(map)/_data/OsmChaUser.zod'
import { OsmOrgUser } from '@app/(map)/_data/OsmOrgUser.zod'

export const fetchUserData = async (userId: string | undefined) => {
  if (!userId) return { osmOrgUser: undefined, osmChaUser: undefined }

  const fetchOsmOrgUser = await fetch(`https://api.openstreetmap.org/api/0.6/user/${userId}.json`)

  const fetchOsmChaUser = await fetch(`https://osmcha.org/api/v1/user-stats/${userId}/`, {
    headers: { Authorization: `Token ${process.env.NEXT_PUBLIC_TEMPORARY_USER_TOKE}` },
  })

  console.info('Fetching', [fetchOsmOrgUser, fetchOsmChaUser])
  const [rawOsmOrgUserResponse, rawOsmChaUserResponse] = await Promise.all([
    fetchOsmOrgUser,
    fetchOsmChaUser,
  ])

  const osmOrgUser = OsmOrgUser.parse(await rawOsmOrgUserResponse.json())
  const osmChaUser = OsmChaUser.parse(await rawOsmChaUserResponse.json())

  return { osmOrgUser, osmChaUser }
}
