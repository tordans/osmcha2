import { getRouteApi } from '@tanstack/react-router'
import clsx from 'clsx'
import { ArrowLeftIcon } from '../components/ui/icons.ts'
import { RouterLink } from '../routing/RouterLink.tsx'

const rootRouteApi = getRouteApi('__root__')

const buttonClasses = clsx(
  'relative isolate inline-flex items-center justify-center gap-x-2 rounded-lg border text-base/6 font-semibold',
  'px-[calc(--spacing(3.5)-1px)] py-[calc(--spacing(2.5)-1px)] sm:px-[calc(--spacing(3)-1px)] sm:py-[calc(--spacing(1.5)-1px)] sm:text-sm/6',
  'text-zinc-950 [--btn-bg:white] [--btn-border:var(--color-zinc-950)]/10',
  'border-transparent bg-(--btn-border) before:absolute before:inset-0 before:-z-10 before:rounded-[calc(var(--radius-lg)-1px)] before:bg-(--btn-bg) before:shadow-sm',
  'cursor-pointer touch-manipulation select-none',
)

export function BackToListButton() {
  const search = rootRouteApi.useSearch()

  return (
    <RouterLink
      to="/"
      search={search}
      aria-label="Back to list"
      className={clsx(
        buttonClasses,
        'fixed top-[max(0.75rem,env(safe-area-inset-top))] left-[max(0.75rem,env(safe-area-inset-left))] z-20 min-h-11 min-w-11 min-[56rem]:hidden',
      )}
    >
      <ArrowLeftIcon data-slot="icon" className="size-5" />
      List
    </RouterLink>
  )
}
