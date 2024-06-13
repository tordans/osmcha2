import 'server-only' // https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment

import { OsmChaRealChangeset, TOsmChaRealChangeset } from '@app/(map)/_data/OsmChaRealChangeset.zod'
import {
  OsmChaRealChangesetGeojson,
  TOsmChaRealChangesetGeojson,
} from '@app/(map)/_data/OsmChaRealChangesetGeojson.zod'
import { OsmOrgChangeset, TOsmOrgChangeset } from '@app/(map)/_data/OsmOrgChangeset.zod'
import { writeStringInTmpFolder } from '@app/(map)/_data/writeDebugFile'
import { realChangesetParser } from '@app/_components/_lib/real-changesets-parser'
import { AnyZodObject } from 'zod'
import { OsmChaChangeset, TOsmChaChangeset } from './OsmChaChangeset.zod'

export const fetchChangesetData = async (changesetId: string) => {
  const fetchOsmChaChangeset = fetch(`https://osmcha.org/api/v1/changesets/${changesetId}/`, {
    headers: { Authorization: `Token ${process.env.NEXT_PUBLIC_TEMPORARY_USER_TOKE}` },
  })
  // console.info(
  //   'Fetching `fetchOsmChaChangeset`',
  //   `curl -I -H "Authorization: Token ${process.env.NEXT_PUBLIC_TEMPORARY_USER_TOKE}" https://osmcha.org/api/v1/changesets/${changesetId}/`,
  // )

  // TODO: Figure out if we need the `osmChaRealChangeset` as data in the app at all; maybe we can use the GeoJson version only? But it does not have the metadata. However it does cleanup some entries that are blank (AFAIK notes that are changed as part of a way). Note: ATM we need it for the bbox in the Map.
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

  const [rawOsmChaChangesetResponse, rawOsmChaRealChangesetResponse, rawOsmOrgChangesetResponse] =
    await Promise.allSettled([fetchOsmChaChangeset, fetchOsmChaRealChangeset, fetchOsmOrgChangeset])

  const handleStatusCheck = async (
    identifier: string,
    allSettledPromise:
      | typeof rawOsmChaRealChangesetResponse
      | typeof rawOsmChaRealChangesetResponse
      | typeof rawOsmOrgChangesetResponse,
  ) => {
    // Handle Network error
    if (allSettledPromise.status === 'rejected') {
      console.error(`ERROR (fetch) with ${identifier}:`, allSettledPromise.reason)
      // TODO: Set global error text to display in UI
      //  One idea was to use `useFetchErrorsActions` (not used) so set an error message that we show on the UI whenever this
      return undefined
    }
    // Handle bad server responses
    if (!allSettledPromise.value.ok) {
      console.error(`ERROR (Network) with ${identifier}:`, allSettledPromise.value.status)
      // TODO: Set global error text to display in UI
      return undefined
    }
    return allSettledPromise.value
  }

  const handleParse = (identifier: string, input: {} | undefined, parser: AnyZodObject) => {
    if (!input) return undefined
    // Try zod parsing, handle errors
    const parsed = parser.safeParse(input)
    if (!parsed.success) {
      console.error(`ERROR (Zod parsing) with ${identifier}:`, parsed.error)
      writeStringInTmpFolder(identifier, JSON.stringify(input, undefined, 2))
      // TODO: Set global error text to display in UI
      return undefined
    }
    // All good, return parsed JSON
    return parsed.data
  }

  // Check status and return value|undefined
  const rawOsmChaChangesetValue = await handleStatusCheck(
    'osmChaChangeset',
    rawOsmChaChangesetResponse,
  )
  const rawOsmChaRealChangesetValue = await handleStatusCheck(
    'osmChaRealChangeset',
    rawOsmChaRealChangesetResponse,
  )
  const rawOsmOrgChangesetValue = await handleStatusCheck(
    'osmOrgChangeset',
    rawOsmOrgChangesetResponse,
  )

  // Perform parse and return parsed JSON|undefined
  const osmChaChangeset = handleParse(
    'osmChaChangeset',
    await rawOsmChaChangesetValue?.json(),
    OsmChaChangeset,
  ) as TOsmChaChangeset | undefined
  const osmChaRealChangesetJson = await rawOsmChaRealChangesetValue?.json()
  const osmChaRealChangeset = handleParse(
    'osmChaRealChangeset',
    await osmChaRealChangesetJson,
    OsmChaRealChangeset,
  ) as TOsmChaRealChangeset | undefined
  const osmChaRealChangesetGeojson = handleParse(
    'osmChaRealChangeset',
    realChangesetParser(osmChaRealChangesetJson),
    OsmChaRealChangesetGeojson,
  ) as TOsmChaRealChangesetGeojson | undefined
  const osmOrgChangeset = handleParse(
    'osmOrgChangeset',
    await rawOsmOrgChangesetValue?.json(),
    OsmOrgChangeset,
  ) as TOsmOrgChangeset | undefined

  return {
    osmChaChangeset,
    osmChaRealChangeset,
    osmChaRealChangesetGeojson,
    osmOrgChangeset,
  }
}
