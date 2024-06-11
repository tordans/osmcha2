import { OsmChaChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaChangeset.zod'
import { OsmChaRealChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaRealChangeset.zod'
import { OsmChaRealChangesetGeojson } from '@app/(map)/_components/Changeset/zod/OsmChaRealChangesetGeojson.zod'
import { OsmChaUser } from '@app/(map)/_components/Changeset/zod/OsmChaUser.zod'
import { OsmOrgChangeset } from '@app/(map)/_components/Changeset/zod/OsmOrgChangeset.zod'
import { OsmOrgUser } from '@app/(map)/_components/Changeset/zod/OsmOrgUser.zod'
import { writeDebugFile } from '@app/(map)/_components/Changeset/zod/writeDebugFile'
import { realChangesetParser } from '@components/_lib/real-changesets-parser'

export const fetchChangesetData = async (changesetId: string) => {
  const fetchOsmChaChangeset = fetch(`https://osmcha.org/api/v1/changesets/${changesetId}/`, {
    headers: { Authorization: `Token ${process.env.NEXT_PUBLIC_TEMPORARY_USER_TOKE}` },
  })
  // console.info(
  //   'Fetching `fetchOsmChaChangeset`',
  //   `curl -I -H "Authorization: Token ${process.env.NEXT_PUBLIC_TEMPORARY_USER_TOKE}" https://osmcha.org/api/v1/changesets/${changesetId}/`,
  // )

  const fetchOsmChaRealChangeset = fetch(
    `https://real-changesets.s3.us-west-2.amazonaws.com/${changesetId}.json`,
  )
  // console.info(
  //   'Fetching `fetchOsmChaRealChangeset`',
  //   `curl -I https://real-changesets.s3.us-west-2.amazonaws.com/${changesetId}.json`,
  // )

  const fetchOsmOrgChangeset = fetch(
    `https://api.openstreetmap.org/api/0.6/changeset/${changesetId}.json?include_discussion=true`,
  )
  // console.info(
  //   'Fetching `fetchOsmOrgChangeset`',
  //   `curl -I https://api.openstreetmap.org/api/0.6/changeset/${changesetId}.json?include_discussion=true`,
  // )

  console.info('Fetching', [fetchOsmChaChangeset, fetchOsmChaRealChangeset, fetchOsmOrgChangeset])
  const [rawOsmChaChangesetResponse, rawOsmChaRealChangesetResponse, rawOsmOrgChangesetResponse] =
    await Promise.all([fetchOsmChaChangeset, fetchOsmChaRealChangeset, fetchOsmOrgChangeset])

  const osmChaChangeset = OsmChaChangeset.parse(await rawOsmChaChangesetResponse.json())

  // TODO: The real changesets are not relyable. They might not exist yet … or not anymore … or where never created successfully.
  //  The current OsmCha can handle this case and falls back to show some information.
  //  One idea was to use `useFetchErrorsActions` (not used) so set an error message that we show on the UI whenever this
  //  However, we need to work around the client vs server components issue first.
  // TODO: This neds to be reworked to handle non 200 status codes.
  // However, the Zod parsing is very strict ATM, so its not easy to pass an empty response.
  // Also the UI is not prepared to handle any non-"perfect" response.
  // INFO: We check the status with rawOsmChaRealChangesetResponse.status === 200 and this API will return XML with status 404 when the changeset is missging on S3.
  const osmChaRealchangesetRaw = await rawOsmChaRealChangesetResponse.json()
  writeDebugFile({
    parser: OsmChaRealChangeset,
    data: osmChaRealchangesetRaw,
    filename: 'osmChaRealchangesetRaw',
  })
  const osmChaRealChangeset = OsmChaRealChangeset.parse(osmChaRealchangesetRaw)

  // TODO: Figure out if we need the `osmChaRealChangeset` at all; maybe we can use the GeoJson version only? But it does not have the metadata. However it does cleanup some entries that are blank (AFAIK notes that are changed as part of a way)
  // Note: ATM we need it for the bbox in the Map.
  const osmChaRealChangesetGeojsonRaw = realChangesetParser(osmChaRealChangeset)
  // `OsmChaRealChangesetGeojson` is not perfect yet and written writ strict `strictObject` so it throws errors. But the errors are not that helpfull, so to debug, there is this console log… — TODO: Find a nicer way to do this.
  writeDebugFile({
    parser: OsmChaRealChangesetGeojson,
    data: osmChaRealChangesetGeojsonRaw,
    filename: 'osmChaRealChangesetGeojsonRaw',
  })
  const osmChaRealChangesetGeojson = OsmChaRealChangesetGeojson.parse(osmChaRealChangesetGeojsonRaw)

  const osmOrgChangeset = OsmOrgChangeset.parse(await rawOsmOrgChangesetResponse.json())

  return {
    osmChaChangeset,
    osmChaRealChangeset,
    osmChaRealChangesetGeojson,
    osmOrgChangeset,
  }
}

export const fetchUserData = async (userId: string) => {
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
