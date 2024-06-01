import { OsmChaChangeset } from '@app/(map)/_components/Changeset/zod/osmChaChangeset'
import { Suspense } from 'react'
import { DebugDataHelper } from './_components/DebugDataHelper'
import { Details } from './_components/Details'
import { Header } from './_components/Header'
import { Map } from './_components/Map'

type Props = { params: { id: string } }

export default async function ChangesetPage({ params }: Props) {
  const resp = await fetch(`https://osmcha.org/api/v1/changesets/${params.id}/`, {
    headers: { Authorization: `Token ${process.env.NEXT_PUBLIC_TEMPORARY_USER_TOKE}` },
  })
  const data = await resp.json()
  const osmChaChangeset = OsmChaChangeset.parse(data)
  // ALSO:
  // https://api.openstreetmap.org/api/0.6/changeset/152005139.json?include_discussion=true
  // https://real-changesets.s3.us-west-2.amazonaws.com/152005139.json
  // https://api.openstreetmap.org/api/0.6/user/10642775.json
  // https://osmcha.org/api/v1/user-stats/17538119/

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
      <DebugDataHelper osmChaChangeset={osmChaChangeset} />
    </Suspense>
  )
}
