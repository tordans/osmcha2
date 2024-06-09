import { Suspense } from 'react'
import { DebugDataHelper } from './_components/DebugDataHelper'
import { Details } from './_components/Details'
import { DetailsHeader } from './_components/DetailsHeader'
import { Map } from './_components/Map'
import { fetchChangesetData, fetchUserData } from './_components/fetchPageData'

type Props = { params: { id: string } }

export default async function ChangesetPage({ params }: Props) {
  const { osmChaChangeset, osmChaRealChangeset, osmChaRealChangesetGeojson, osmOrgChangeset } =
    await fetchChangesetData(params.id)
  const { osmOrgUser, osmChaUser } = await fetchUserData(osmChaChangeset.properties.uid)

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex h-full">
        <div className="h-full grow">
          <Map
            osmChaChangeset={osmChaChangeset}
            osmChaRealChangeset={osmChaRealChangeset}
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
    </Suspense>
  )
}
