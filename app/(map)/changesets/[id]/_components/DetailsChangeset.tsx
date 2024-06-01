import { TOsmChaChangesetProperties } from '@app/(map)/_components/Changeset/zod/osmChaChangeset'

type Props = { changeset: TOsmChaChangesetProperties }

export const DetailsChangeset = ({ changeset }: Props) => {
  return (
    <section>
      <div className="rounded bg-zinc-50 p-1">{changeset.comment}</div>
    </section>
  )
}
