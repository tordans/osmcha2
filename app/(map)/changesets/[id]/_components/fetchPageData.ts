import { OsmChaChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaChangeset.zod'
import { OsmChaRealChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaRealChangeset.zod'
import { OsmChaRealChangesetGeojson } from '@app/(map)/_components/Changeset/zod/OsmChaRealChangesetGeojson.zod'
import { OsmChaUser } from '@app/(map)/_components/Changeset/zod/OsmChaUser.zod'
import { OsmOrgChangeset } from '@app/(map)/_components/Changeset/zod/OsmOrgChangeset.zod'
import { OsmOrgUser } from '@app/(map)/_components/Changeset/zod/OsmOrgUser.zod'
import { realChangesetParser } from '@components/_lib/real-changesets-parser'
import fs from 'fs'
import path from 'path'

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
  //  The current OsmCha can handle this case and fall back to show some information.
  //  One idea was to use useFetchErrorsActions so set an error message that we show on the UI whenever this
  //  However, we need to work around the client vs server components issue first.
  const osmChaRealchangesetRaw = await rawOsmChaRealChangesetResponse.json()
  try {
    OsmChaRealChangeset.parse(osmChaRealchangesetRaw)
  } catch (error) {
    const file = path.join(__dirname, '../../../../../../tmp', 'osmChaRealchangesetRaw.json')
    console.info('ERROR, write debugging at ', file)
    fs.writeFileSync(file, JSON.stringify(osmChaRealchangesetRaw, undefined, 2))
  }
  const osmChaRealChangeset = OsmChaRealChangeset.parse(osmChaRealchangesetRaw)

  // TODO: Figure out if we need the `osmChaRealChangeset` at all; maybe we can use the GeoJson version only? But it does not have the metadata. However it does cleanup some entries that are blank (AFAIK notes that are changed as part of a way)
  // Note: ATM we need it for the bbox in the Map.
  const osmChaRealChangesetGeojsonRaw = realChangesetParser(osmChaRealChangeset)
  // `OsmChaRealChangesetGeojson` is not perfect yet and written writ strict `strictObject` so it throws errors. But the errors are not that helpfull, so to debug, there is this console log… — TODO: Find a nicer way to do this.
  try {
    OsmChaRealChangesetGeojson.parse(osmChaRealChangesetGeojsonRaw)
  } catch (error) {
    const file = path.join(__dirname, '../../../../../../tmp', 'osmChaRealChangesetGeojsonRaw.json')
    console.info('ERROR, write debugging at ', file)
    fs.writeFileSync(file, JSON.stringify(osmChaRealChangesetGeojsonRaw, undefined, 2))
  }
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

  const [rawOsmOrgUserResponse, rawOsmChaUserResponse] = await Promise.all([
    fetchOsmOrgUser,
    fetchOsmChaUser,
  ])

  const osmOrgUser = OsmOrgUser.parse(await rawOsmOrgUserResponse.json())
  const osmChaUser = OsmChaUser.parse(await rawOsmChaUserResponse.json())

  return { osmOrgUser, osmChaUser }
}
