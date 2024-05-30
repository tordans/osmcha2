import { Badge } from '@components/core/badge'
import Link from 'next/link'
import { Suspense } from 'react'

type Props = { changesets: any }

export const ChangesetListeSidebar = ({ changesets }: Props) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <nav className="h-full overflow-y-scroll">
        <ul>
          {changesets.features.map((changeset: any) => (
            <li key={changeset.id}>
              <Link href={`/changesets/${changeset.id as number}`}>
                <code>#{changeset.id}</code> {changeset.properties.user}{' '}
                {changeset.properties.editor} {changeset.properties.comment}{' '}
                {changeset.properties.date}
                {changeset.properties.reasons?.map((reason: { id: number; name: string }) => {
                  return <Badge key={reason.id}>{reason.name}</Badge>
                })}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Suspense>
  )
}
