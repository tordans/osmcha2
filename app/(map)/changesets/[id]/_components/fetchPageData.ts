import { OsmChaChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaChangeset.zod'
import { OsmChaRealChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaRealChangeset.zod'
import { OsmChaUser } from '@app/(map)/_components/Changeset/zod/OsmChaUser.zod'
import { OsmOrgChangeset } from '@app/(map)/_components/Changeset/zod/OsmOrgChangeset.zod'
import { OsmOrgUser } from '@app/(map)/_components/Changeset/zod/OsmOrgUser.zod'

export const fetchChangesetData = async (changesetId: string) => {
  const fetchOsmChaChangeset = fetch(`https://osmcha.org/api/v1/changesets/${changesetId}/`, {
    headers: { Authorization: `Token ${process.env.NEXT_PUBLIC_TEMPORARY_USER_TOKE}` },
  })

  const fetchOsmChaRealChangeset = fetch(
    `https://real-changesets.s3.us-west-2.amazonaws.com/${changesetId}.json`,
  )

  const fetchOsmOrgChangeset = fetch(
    `https://api.openstreetmap.org/api/0.6/changeset/${changesetId}.json?include_discussion=true`,
  )

  const [rawOsmChaChangesetResponse, rawOsmChaRealChangesetResponse, rawOsmOrgChangesetResponse] =
    await Promise.all([fetchOsmChaChangeset, fetchOsmChaRealChangeset, fetchOsmOrgChangeset])

  const osmChaChangeset = OsmChaChangeset.parse(await rawOsmChaChangesetResponse.json())
  // TODO: The real changesets are not relyable. They might not exist yet … or not anymore … or where never created successfully.
  //  The current UI can handle this case and fall back to show some information.
  //  One idea was to use useFetchErrorsActions so set an error message that we show on the UI whenever this
  //  However, we need to work around the client vs server components issue first.
  const osmChaRealChangeset = OsmChaRealChangeset.parse(await rawOsmChaRealChangesetResponse.json())
  const osmOrgChangeset = OsmOrgChangeset.parse(await rawOsmOrgChangesetResponse.json())

  return {
    osmChaChangeset,
    osmChaRealChangeset,
    osmOrgChangeset,
  }
}

export const fetchUserData = async (userId: string) => {
  const fetchOsmOrgUser = await fetch(`https://api.openstreetmap.org/api/0.6/user/${userId}.json`)

  const fetchOsmChaUser = await fetch(`https://osmcha.org/api/v1/user-stats/${userId}/`, {
    headers: { Authorization: `Token ${process.env.NEXT_PUBLIC_TEMPORARY_USER_TOKE}` },
  })

  const [rawOsmOrgUserResponse, rawOsmChaUserResponse] = await Promise.all([
    fetchOsmOrgUser,
    fetchOsmChaUser,
  ])

  const osmOrgUser = OsmOrgUser.parse(await rawOsmOrgUserResponse.json())
  const osmChaUser = OsmChaUser.parse(await rawOsmChaUserResponse.json())

  return { osmOrgUser, osmChaUser }
}
