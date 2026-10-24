import clsx from 'clsx'
import type { ReactNode } from 'react'
import { Badge } from '../ui/badge.tsx'
import { XMarkIcon } from '../ui/icons.ts'
import { ACTION } from './actionColors.ts'
import {
  currentElement,
  isNoopAction,
  primaryTagMutation,
  tagMutationRows,
  tagRows,
  type AdiffAction,
  type ElementChange,
  type TagMutation,
} from './changesetElements.ts'
import { formatMoveMeters } from './minorMoves.ts'

/**
 * Phone map view: the selected element floating above the sheet strip. Tapping it opens
 * the list at that row; × clears the selection.
 */
export function ElementCard({
  action,
  change,
  onOpen,
  onClear,
}: {
  action: AdiffAction
  /** The listed change for `action`; carries split info and tags diffed against the parent way. */
  change?: ElementChange
  onOpen: () => void
  onClear: () => void
}) {
  const element = currentElement(action)
  const actionKey = isNoopAction(action)
    ? 'noop'
    : change?.splitFrom != null
      ? 'split'
      : action.type === 'create' || action.type === 'delete'
        ? action.type
        : 'modify'
  const tags = change?.tags ?? tagRows(action)
  const mutation = primaryTagMutation(tags)
  const splitFrom = change?.splitFrom
  const sameTagsAsParent =
    splitFrom != null && tags.length > 0 && tagMutationRows(tags).length === 0
  const label = `${element?.type ?? 'element'}/${element?.id ?? ''}`

  return (
    <div className="flex items-stretch rounded-xl bg-white shadow-lg ring-1 ring-zinc-950/10">
      <button
        type="button"
        aria-label={`Show ${label} in the list`}
        onClick={onOpen}
        className="flex min-h-11 min-w-0 flex-1 cursor-pointer touch-manipulation flex-col items-start justify-center gap-0.5 px-3 py-2 text-left select-none"
      >
        <span className="flex w-full min-w-0 items-center gap-1.5 text-sm font-medium text-zinc-950">
          <Badge color={ACTION[actionKey].token}>{ACTION[actionKey].label}</Badge>
          <span className="truncate">{label}</span>
        </span>
        {mutation ? <TagMutationLine mutation={mutation} /> : null}
        {sameTagsAsParent ? <NoteLine>Same tags as way/{splitFrom}</NoteLine> : null}
        {change?.minorMove ? (
          <NoteLine>Minor move · {formatMoveMeters(change.minorMove.meters)}</NoteLine>
        ) : null}
        {change?.splitInto && !mutation ? (
          <NoteLine>Split into {change.splitInto.map((id) => `way/${id}`).join(', ')}</NoteLine>
        ) : null}
      </button>
      <button
        type="button"
        aria-label="Clear selection"
        onClick={onClear}
        className="flex w-11 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-r-xl text-zinc-500 select-none active:bg-zinc-950/5"
      >
        <XMarkIcon className="size-4" />
      </button>
    </div>
  )
}

function NoteLine({ children }: { children: ReactNode }) {
  return <span className="w-full truncate text-xs/4 text-zinc-600">{children}</span>
}

function TagMutationLine({ mutation }: { mutation: TagMutation }) {
  const className = 'w-full truncate font-mono text-xs/4 text-zinc-600'
  if (mutation.kind === 'changed') {
    return (
      <span className={className}>
        {mutation.key}: {mutation.oldValue} → {mutation.newValue}
      </span>
    )
  }
  return (
    <span
      className={clsx(
        className,
        mutation.kind === 'added'
          ? ACTION.create.tagText
          : clsx(ACTION.delete.tagText, 'line-through'),
      )}
    >
      {mutation.kind === 'added' ? '+' : '−'} {mutation.key}={mutation.value}
    </span>
  )
}
