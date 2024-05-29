import { Suspense } from 'react'

type Props = { changesets: any }

export const ChangesetListeSidebar = ({ changesets }: Props) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <nav>
        <ul>
          {changesets.features.map((changeset: any) => (
            <li key={changeset.id}>{changeset.id}</li>
          ))}
        </ul>
      </nav>
    </Suspense>
  )
}
