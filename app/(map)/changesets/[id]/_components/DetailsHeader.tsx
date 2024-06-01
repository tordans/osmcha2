import { RelativeTime } from '@app/(map)/_components/Changeset/RelativeTime'
import { TOsmChaChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaChangeset.zod'
import { editorShortname } from '@app/(map)/_components/utils/editorShortname'
import { ClockIcon, PencilSquareIcon, UserIcon } from '@heroicons/react/16/solid'
import { HeaderOpenInButton } from './HeaderOpenInButton'

type Props = { changeset: TOsmChaChangeset }

export const DetailsHeader = ({ changeset }: Props) => {
  return (
    <header className="flex flex-col gap-1 bg-zinc-50 px-3 py-1">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-semibold">Changeset #{changeset.id}</h1>
        <HeaderOpenInButton changeset={changeset} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <UserIcon className="size-4" aria-hidden />
          {changeset.properties.user}
        </div>

        <div className="flex items-center gap-1">
          <ClockIcon className="size-4" aria-hidden />
          <RelativeTime createdAt={changeset.properties.date} />
        </div>

        <div className="flex items-center gap-1">
          <PencilSquareIcon className="size-4" aria-hidden />
          <abbr title={changeset.properties.editor} className="cursor-help">
            {editorShortname(changeset.properties.editor)}
          </abbr>
        </div>
      </div>
    </header>
  )
}
