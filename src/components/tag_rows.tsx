import clsx from 'clsx'
import type { ReactNode } from 'react'
import { ACTION } from './changeset/actionColors.ts'
import { AddNoteButton } from './changeset/AddNoteButton.tsx'
import { ArrowRightIcon, ChatBubbleLeftIcon } from './ui/icons.ts'
import { typeScale } from './ui/typography.ts'

export type TagRowsItem =
  | { kind: 'added'; key: string; value: ReactNode; rawValue?: string }
  | { kind: 'removed'; key: string; value: ReactNode; rawValue?: string }
  | {
      kind: 'changed'
      key: string
      oldValue: ReactNode
      newValue: ReactNode
      rawOld?: string
      rawNew?: string
    }
  | { kind: 'unchanged'; key: string; value: ReactNode; rawValue?: string }

function textOf(value: ReactNode, raw?: string) {
  if (raw != null) return raw
  return typeof value === 'string' ? value : undefined
}

function wrapClass(value: ReactNode, raw?: string) {
  const text = textOf(value, raw)
  return text?.includes('http') ? 'break-all' : 'break-words'
}

function TagChange({
  oldValue,
  newValue,
  rawOld,
  rawNew,
}: {
  oldValue: ReactNode
  newValue: ReactNode
  rawOld?: string
  rawNew?: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
      <span
        className={clsx('min-w-0', ACTION.delete.tagText, wrapClass(oldValue, rawOld))}
        dir="auto"
      >
        {oldValue}
      </span>
      <ArrowRightIcon className="size-3 flex-none text-zinc-400" />
      <span
        className={clsx('min-w-0', ACTION.create.tagText, wrapClass(newValue, rawNew))}
        dir="auto"
      >
        {newValue}
      </span>
    </div>
  )
}

function rowToneClass(kind: TagRowsItem['kind'], clickable: boolean) {
  if (kind === 'added') {
    return clsx(ACTION.create.tagBg, clickable && ACTION.create.tagBgHover)
  }
  if (kind === 'removed') {
    return clsx(ACTION.delete.tagBg, clickable && ACTION.delete.tagBgHover)
  }
  if (kind === 'changed') {
    return clsx(ACTION.modify.tagBg, clickable && ACTION.modify.tagBgHover)
  }
  return clickable ? ACTION.noop.tagBgHover : undefined
}

function TagRowValue({ row }: { row: TagRowsItem }) {
  if (row.kind === 'changed') {
    return (
      <div
        className={
          wrapClass(row.oldValue, row.rawOld) === 'break-all' ||
          wrapClass(row.newValue, row.rawNew) === 'break-all'
            ? 'break-all'
            : 'break-words'
        }
      >
        <TagChange
          oldValue={row.oldValue}
          newValue={row.newValue}
          rawOld={row.rawOld}
          rawNew={row.rawNew}
        />
      </div>
    )
  }

  const wrap = wrapClass(row.value, row.rawValue)
  const tone =
    row.kind === 'added'
      ? ACTION.create.tagText
      : row.kind === 'removed'
        ? ACTION.delete.tagText
        : ACTION.noop.tagText

  return (
    <div className={clsx(tone, wrap)} dir="auto">
      {row.value}
    </div>
  )
}

export function TagRows({
  rows,
  emptyLabel,
  className,
  highlightedKey,
  onKeyClick,
  noteCountByKey,
  onNoteCountClick,
  onAddNote,
  activeNoteKey,
}: {
  rows: TagRowsItem[]
  emptyLabel?: string
  className?: string
  highlightedKey?: string
  onKeyClick?: (key: string) => void
  noteCountByKey?: Record<string, number>
  onNoteCountClick?: (key: string) => void
  onAddNote?: (key: string) => void
  activeNoteKey?: string
}) {
  if (rows.length === 0) {
    return emptyLabel ? (
      <p className={clsx('px-1 py-1 text-zinc-500', typeScale.small, className)}>{emptyLabel}</p>
    ) : null
  }

  return (
    <dl
      className={clsx(
        '@container/tags grid w-full grid-cols-[auto_auto_minmax(4.5rem,1fr)] font-mono',
        '@min-[16rem]/tags:grid-cols-[auto_auto_minmax(7rem,1fr)]',
        '@min-[20rem]/tags:grid-cols-[auto_auto_minmax(9rem,1fr)]',
        '@min-[24rem]/tags:grid-cols-[auto_auto_minmax(11rem,1fr)]',
        typeScale.small,
        className,
      )}
    >
      {rows.map((row) => (
        <div
          key={row.key}
          className={clsx(
            'group col-span-3 grid grid-cols-subgrid items-center gap-x-1.5 border-b border-zinc-950/5 px-1 py-0.5',
            rowToneClass(row.kind, Boolean(onKeyClick)),
            onKeyClick && 'cursor-pointer touch-manipulation',
            highlightedKey === row.key && 'ring-2 ring-yellow-400 ring-offset-1',
          )}
          onClick={
            onKeyClick
              ? (event) => {
                  event.stopPropagation()
                  onKeyClick(row.key)
                }
              : undefined
          }
        >
          <dt
            className="max-w-[8rem] min-w-0 font-medium break-all text-zinc-800 @min-[20rem]/tags:max-w-[11rem]"
            title={row.key}
          >
            {row.key}
          </dt>
          <span className="text-zinc-300 select-none" aria-hidden>
            =
          </span>
          <dd className="flex min-w-0 items-center gap-1">
            <div className="min-w-0 flex-1">
              <TagRowValue row={row} />
            </div>
            <TagNoteCountBadge
              tagKey={row.key}
              count={noteCountByKey?.[row.key] ?? 0}
              onNoteCountClick={onNoteCountClick}
            />
            {onAddNote ? (
              <span
                className={clsx(
                  'inline-flex',
                  activeNoteKey !== row.key &&
                    'pointer-fine:opacity-0 pointer-fine:group-focus-within:opacity-100 pointer-fine:group-hover:opacity-100',
                )}
              >
                <AddNoteButton
                  compact
                  label={
                    activeNoteKey === row.key
                      ? `Close note on ${row.key}`
                      : `Add a note on ${row.key}`
                  }
                  pressed={activeNoteKey === row.key}
                  onClick={() => onAddNote(row.key)}
                />
              </span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function TagNoteCountBadge({
  tagKey,
  count,
  onNoteCountClick,
}: {
  tagKey: string
  count: number
  onNoteCountClick?: (key: string) => void
}) {
  if (count <= 0) return null

  const label = `${count} ${count === 1 ? 'note' : 'notes'} on ${tagKey}`
  const className = clsx(
    'relative inline-flex shrink-0 items-center gap-0.5 rounded-md bg-zinc-600/10 px-1',
    'text-[10px] leading-4 font-medium text-zinc-700',
    "after:absolute after:inset-x-0 after:-inset-y-2.5 after:content-['']",
  )

  if (!onNoteCountClick) {
    return (
      <span className={className} aria-label={label}>
        <ChatBubbleLeftIcon variant="fill" className="size-3" />
        {count}
      </span>
    )
  }

  return (
    <button
      type="button"
      aria-label={label}
      className={clsx(className, 'cursor-pointer hover:bg-zinc-600/20')}
      onClick={(event) => {
        event.stopPropagation()
        onNoteCountClick(tagKey)
      }}
    >
      <ChatBubbleLeftIcon variant="fill" className="size-3" />
      {count}
    </button>
  )
}
