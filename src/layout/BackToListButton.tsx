import { getRouteApi } from '@tanstack/react-router'
import clsx from 'clsx'
import { useSelectedList } from '../components/list/useSelectedList.ts'
import { ArrowLeftIcon } from '../components/ui/icons.ts'
import { RouterLink } from '../routing/RouterLink.tsx'
import { ListButtonLabel } from './ListButtonLabel.tsx'

const rootRouteApi = getRouteApi('__root__')

// Same surface and 44px height as the map buttons and the work area bar beside it:
// a ring outside the box, not a border inside it, so all three line up.
const buttonClasses = clsx(
  'inline-flex h-11 items-center justify-center gap-x-2 rounded-lg px-3.5 text-base/6 font-semibold sm:px-3 sm:text-sm/6',
  'bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-950/10',
  'cursor-pointer touch-manipulation transition-transform duration-100 select-none active:scale-[0.97] active:bg-zinc-100',
)

export function BackToListButton() {
  const search = rootRouteApi.useSearch()
  const { label } = useSelectedList()

  return (
    <RouterLink
      to="/"
      search={search}
      aria-label={`Back to list: ${label}`}
      className={clsx(
        buttonClasses,
        'fixed top-[max(0.75rem,env(safe-area-inset-top))] left-[max(0.75rem,env(safe-area-inset-left))] z-20 w-fit min-w-11 min-[56rem]:hidden',
      )}
    >
      <ArrowLeftIcon data-slot="icon" className="size-5" />
      <ListButtonLabel />
    </RouterLink>
  )
}
