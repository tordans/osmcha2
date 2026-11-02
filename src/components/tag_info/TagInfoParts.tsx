import clsx from 'clsx'
import type { ReactNode } from 'react'
import type { FetchedEntry } from '../../stores/fetched-facts-store.ts'
import { RelativeTime } from '../relative_time.tsx'
import { ArrowPathIcon, ChevronUpIcon, LoaderCircleIcon } from '../ui/icons.ts'

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline active:opacity-60"
    >
      {children}
    </a>
  )
}

/** The mini button next to a value: it loads what a third party knows, then folds it. */
export function TagInfoButton({
  name,
  icon,
  entry,
  loading,
  dim = false,
  hoverOnly = false,
  onLoad,
  onToggle,
}: {
  /** For the label, like `Wikidata Q64`. */
  name: string
  icon: ReactNode
  entry: FetchedEntry<unknown> | null
  loading: boolean
  dim?: boolean
  /** Until it is loaded, with a fine pointer: on many rows it would only add noise. */
  hoverOnly?: boolean
  onLoad: () => void
  onToggle: (open: boolean) => void
}) {
  const label = entry ? `${entry.open ? 'Hide' : 'Show'} ${name}` : `Load ${name}`
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-expanded={entry ? entry.open : undefined}
      disabled={loading}
      onClick={(event) => {
        // The row selects its tag key on click; this is about the tag's documentation.
        event.stopPropagation()
        if (entry) onToggle(!entry.open)
        else onLoad()
      }}
      className={clsx(
        "relative inline-flex h-5 flex-none cursor-pointer touch-manipulation items-center gap-0.5 bg-white px-0.5 text-zinc-500 select-none after:absolute after:-inset-x-1 after:content-['']",
        'focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-default',
        // Open, it is a tab of the card below: it reaches down over the card's top line. Same solid
        // colour as the card: translucent lines would show where they cross.
        entry?.open
          ? 'z-10 -mb-px self-end rounded-t border-x border-t border-zinc-200 pb-px after:-top-3 after:bottom-0 active:bg-zinc-100'
          : 'rounded ring-1 ring-zinc-950/10 transition-transform duration-100 after:-inset-y-3 hover:bg-zinc-50 hover:ring-zinc-950/20 active:scale-[0.97] active:bg-zinc-100',
        dim && 'opacity-60',
        hoverOnly &&
          !entry &&
          !loading &&
          'pointer-fine:opacity-0 pointer-fine:group-focus-within/tag-row:opacity-100 pointer-fine:group-hover/tag-row:opacity-100',
      )}
    >
      {loading ? (
        <LoaderCircleIcon className="size-3.5 animate-spin text-zinc-400" aria-hidden />
      ) : (
        icon
      )}
      {entry?.open ? <ChevronUpIcon className="size-2.5 text-zinc-500" aria-hidden /> : null}
    </button>
  )
}

/** The open entry below a row, with its age and a way to load it again. */
export function TagInfoCard({
  fetchedAt,
  reloadLabel,
  reloading,
  failed,
  dim = false,
  onReload,
  children,
}: {
  fetchedAt: number
  reloadLabel: string
  reloading: boolean
  failed: boolean
  dim?: boolean
  onReload: () => void
  children: ReactNode
}) {
  return (
    <div
      className={clsx(
        'rounded-md rounded-tr-none border border-zinc-200 bg-white px-2 pt-1.5 pb-1 leading-snug',
        dim && 'opacity-60',
      )}
    >
      {children}
      <div className="mt-1 flex items-center justify-between gap-2 text-zinc-500">
        <span>
          <RelativeTime datetime={new Date(fetchedAt)} />
          {failed ? <span className="text-red-700"> Could not load again</span> : null}
        </span>
        <button
          type="button"
          aria-label={reloadLabel}
          title={reloadLabel}
          disabled={reloading}
          onClick={onReload}
          className="relative inline-flex cursor-pointer touch-manipulation text-zinc-500 after:absolute after:-inset-2.5 after:content-[''] hover:text-zinc-900 active:opacity-60 disabled:cursor-default"
        >
          <ArrowPathIcon className={clsx('size-3.5', reloading && 'animate-spin')} aria-hidden />
        </button>
      </div>
    </div>
  )
}

/** The grid line below a row. Empty, it takes no room. */
export function TagInfoList({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ul
      aria-label={label}
      // The row selects its tag key on click; links and buttons in here are not that.
      onClick={(event) => event.stopPropagation()}
      className="col-span-3 col-start-3 flex flex-col items-start gap-1 pb-0.5 font-sans text-[11px] empty:hidden @min-[24rem]/tags:col-span-1 @min-[24rem]/tags:col-start-5"
    >
      {children}
    </ul>
  )
}
