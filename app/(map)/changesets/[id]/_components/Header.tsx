import { UserIcon } from '@heroicons/react/16/solid'
import { HeaderOpenInButton } from './HeaderOpenInButton'

type Props = { changeset: any }

export const Header = ({ changeset }: Props) => {
  return (
    <header className="flex items-center justify-between gap-2 bg-zinc-50 px-3 py-1">
      <div className="flex items-center gap-2">
        <h1 className="font-semibold">Changeset #{changeset.id}</h1>
        <HeaderOpenInButton changeset={changeset} />
        <div className="flex items-center gap-1">
          <UserIcon className="size-4" />
          {changeset.properties.user}
        </div>
      </div>
      <div>TODO Good</div>
    </header>
  )
}
