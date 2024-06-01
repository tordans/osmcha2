import { OsmChaChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaChangeset.zod'
import { OsmChaRealChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaRealChangeset.zod'
import { OsmChaUser } from '@app/(map)/_components/Changeset/zod/OsmChaUser.zod'
import { OsmOrgChangeset } from '@app/(map)/_components/Changeset/zod/OsmOrgChangeset.zod'
import { OsmOrgUser } from '@app/(map)/_components/Changeset/zod/OsmOrgUser.zod'

export const fetchChangesetData = async (changesetId: string) => {
  const rawOsmChaChangesetResponse = await fetch(
    `https://osmcha.org/api/v1/changesets/${changesetId}/`,
    {
      headers: { Authorization: `Token ${process.env.NEXT_PUBLIC_TEMPORARY_USER_TOKE}` },
    },
  )
  const rawOsmChaChangeset = await rawOsmChaChangesetResponse.json()
  const osmChaChangeset = OsmChaChangeset.parse(rawOsmChaChangeset)

  const rawOsmChaRealChangesetResponse = await fetch(
    `https://real-changesets.s3.us-west-2.amazonaws.com/${changesetId}.json`,
  )
  const rawOsmChaRealChangeset = await rawOsmChaRealChangesetResponse.json()
  const osmChaRealChangeset = OsmChaRealChangeset.parse(rawOsmChaRealChangeset)

  const rawOsmOrgChangesetResponse = await fetch(
    `https://api.openstreetmap.org/api/0.6/changeset/${changesetId}.json?include_discussion=true`,
  )
  const rawOsmOrgChangeset = await rawOsmOrgChangesetResponse.json()
  const osmOrgChangeset = OsmOrgChangeset.parse(rawOsmOrgChangeset)

  return { osmChaChangeset, osmChaRealChangeset, osmOrgChangeset }
}

export const fetchUserData = async (userId: string) => {
  const rawOsmOrgUserResponse = await fetch(
    `https://api.openstreetmap.org/api/0.6/user/${userId}.json`,
  )
  const rawOsmOrgUser = await rawOsmOrgUserResponse.json()
  const osmOrgUser = OsmOrgUser.parse(rawOsmOrgUser)

  const rawOsmChaUserResponse = await fetch(`https://osmcha.org/api/v1/user-stats/${userId}/`, {
    headers: { Authorization: `Token ${process.env.NEXT_PUBLIC_TEMPORARY_USER_TOKE}` },
  })
  const rawOsmChaUser = await rawOsmChaUserResponse.json()
  const osmChaUser = OsmChaUser.parse(rawOsmChaUser)

  return { osmOrgUser, osmChaUser }
}
