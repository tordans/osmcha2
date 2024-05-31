import { Suspense } from 'react'
import { Map } from './_components/Map'

type Props = { params: { id: string } }

export default async function ChangesetPage({ params }: Props) {
  const resp = await fetch(`https://osmcha.org/api/v1/changesets/${params.id}/`, {
    headers: { Authorization: `Token ${process.env.NEXT_PUBLIC_TEMPORARY_USER_TOKE}` },
  })
  const data = await resp.json()
  // ALSO:
  // https://api.openstreetmap.org/api/0.6/changeset/152005139.json?include_discussion=true
  // https://real-changesets.s3.us-west-2.amazonaws.com/152005139.json
  // https://api.openstreetmap.org/api/0.6/user/10642775.json
  // https://osmcha.org/api/v1/user-stats/17538119/

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex h-full gap-2">
        <div className="h-full grow">
          <Map changeset={data} />
        </div>
        <div className="w-80">
          <pre className="h-full flex-1 overflow-y-scroll">
            {JSON.stringify(data, undefined, 2)}
          </pre>
        </div>
      </div>
    </Suspense>
  )
}
