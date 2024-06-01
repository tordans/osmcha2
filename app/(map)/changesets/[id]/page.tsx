import { Suspense } from 'react'
import { DebugDataHelper } from './_components/DebugDataHelper'
import { Details } from './_components/Details'
import { Header } from './_components/Header'
import { Map } from './_components/Map'
import { fetchChangesetData, fetchUserData } from './_components/fetchPageData'

type Props = { params: { id: string } }

export default async function ChangesetPage({ params }: Props) {
  const { osmChaChangeset, osmChaRealChangeset, osmOrgChangeset } = await fetchChangesetData(
    params.id,
  )
  const { osmOrgUser, osmChaUser } = await fetchUserData(osmChaChangeset.properties.uid)

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex h-full flex-col">
        <Header changeset={osmChaChangeset} />
        <div className="flex h-full gap-2">
          <div className="h-full grow">
            <Map changeset={osmChaChangeset} />
          </div>
          <Details changeset={osmChaChangeset} />
        </div>
      </div>
      <DebugDataHelper
        osmChaChangeset={osmChaChangeset}
        osmOrgChangeset={osmOrgChangeset}
        osmChaRealChangeset={osmChaRealChangeset}
        osmChaUser={osmChaUser}
        osmOrgUser={osmOrgUser}
      />
    </Suspense>
  )
}
