import { Suspense } from 'react'

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
      <pre className="flex-1 overflow-y-auto">{JSON.stringify(data, undefined, 2)}</pre>
    </Suspense>
  )
}