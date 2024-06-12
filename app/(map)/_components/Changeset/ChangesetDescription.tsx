'use client'
import { TOsmChaChangeset } from '@app/(map)/_zod/OsmChaChangeset.zod'
import { TOsmChaChangesets } from '@app/(map)/_zod/OsmChaChangesets.zod'

type Props = { changeset: TOsmChaChangesets['features'][number] | TOsmChaChangeset }

export const ChangesetDescription = ({ changeset }: Props) => {
  return (
    <p
      className="w-full hyphens-auto break-words leading-tight"
      // The hypens need a lang tag to work.
      // Using the locale here is not ideal because users might use a different lang for their changeset comments than they used for the editor UI. However, this has better results than not adding it.
      // BUT, we only have the metadata.locale when using the /changesets API, not the /changesets/{id} API.
      // lang={changeset.properties?.metadata?.locale || 'en'}
    >
      <strong className="font-semibold">{changeset.properties.user}:</strong>{' '}
      {changeset.properties.comment}
    </p>
  )
}
