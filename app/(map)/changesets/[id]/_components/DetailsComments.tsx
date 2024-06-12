import { TOsmOrgChangeset } from '@app/(map)/_data/OsmOrgChangeset.zod'

type Props = { discussions: TOsmOrgChangeset['elements'][number]['discussion'] }

export const DetailsComments = ({ discussions }: Props) => {
  return (
    <section>
      <pre>{JSON.stringify(discussions, undefined, 2)}</pre>
    </section>
  )
}
