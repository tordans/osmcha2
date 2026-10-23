import clsx from 'clsx'
import { Badge } from '../ui/badge.tsx'
import { XMarkIcon } from '../ui/icons.ts'
import { ACTION } from './actionColors.ts'
import {
  currentElement,
  isNoopAction,
  primaryTagMutation,
  tagRows,
  type AdiffAction,
  type TagMutation,
} from './changesetElements.ts'

/**
 * Phone map view: the selected element floating above the sheet strip. Tapping it opens
 * the list at that row; × clears the selection.
 */
export function ElementCard({
  action,
  onOpen,
  onClear,
}: {
  action: AdiffAction
  onOpen: () => void
  onClear: () => void
}) {
  const element = currentElement(action)
  const actionKey = isNoopAction(action)
    ? 'noop'
    : action.type === 'create' || action.type === 'delete'
      ? action.type
      : 'modify'
  const mutation = primaryTagMutation(tagRows(action))
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
