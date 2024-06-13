import { fetchUserData } from '@app/(map)/_data/fetchUserData'
import { searchParamsCache } from '@app/(map)/_data/searchParams'
import { notFound } from 'next/navigation'
import { SearchParams } from 'nuqs/server'
import { fetchChangesetData } from '../../_data/fetchChangesetData'
import { DebugDataHelper } from './_components/DebugDataHelper'
import { Details } from './_components/Details'
import { DetailsHeader } from './_components/DetailsHeader'
import { Map } from './_components/Map'

type Props = { params: { id: string }; searchParams: SearchParams }

export default async function ChangesetPage({ params, searchParams }: Props) {
  const { filters, orderBy } = searchParamsCache.parse(searchParams)

  let { osmChaChangeset, osmChaRealChangeset, osmChaRealChangesetGeojson, osmOrgChangeset } =
    await fetchChangesetData(params.id)
  const userId = osmOrgChangeset?.elements?.[0].uid?.toString() || osmChaChangeset?.properties?.uid
  const { osmOrgUser, osmChaUser } = await fetchUserData(userId)

  if (!(osmChaChangeset && osmOrgChangeset && osmOrgUser && osmChaUser)) {
    notFound()
  }

  return (
    <>
      <div className="flex h-full">
        <div className="h-full grow">
          <Map
            osmChaChangeset={osmChaChangeset}
            osmChaRealChangesetGeojson={osmChaRealChangesetGeojson}
          />
        </div>
        <div className="flex w-96 flex-col">
          <DetailsHeader
            osmChaChangeset={osmChaChangeset}
            osmOrgUser={osmOrgUser}
            osmChaUser={osmChaUser}
          />
          <Details
            osmChaChangeset={osmChaChangeset}
            osmChaRealChangeset={osmChaRealChangeset}
            osmOrgChangeset={osmOrgChangeset}
          />
        </div>
      </div>
      <DebugDataHelper
        osmChaChangeset={osmChaChangeset}
        osmChaRealChangeset={osmChaRealChangeset}
        osmChaRealChangesetGeojson={osmChaRealChangesetGeojson}
        osmOrgChangeset={osmOrgChangeset}
        osmChaUser={osmChaUser}
        osmOrgUser={osmOrgUser}
      />
    </>
  )
}
