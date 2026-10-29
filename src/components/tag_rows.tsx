import clsx from 'clsx'
import { Fragment, type ReactNode } from 'react'
import { ACTION } from './changeset/actionColors.ts'
import { AddNoteButton } from './changeset/AddNoteButton.tsx'
import { orderTagRows, tagRowKeys, type TagRow } from './changeset/changesetElements.ts'
import { StreetImageryChips } from './street_imagery/StreetImageryChips.tsx'
import { streetImageryPhotosOfRow } from './street_imagery/streetImageryTags.ts'
import { TrafficSignChips } from './traffic_signs/TrafficSignChips.tsx'
import { countryPrefixOfValue, trafficSignValueOfRow } from './traffic_signs/trafficSignRows.ts'
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
  | { kind: 'renamed'; oldKey: string; key: string; value: ReactNode; rawValue?: string }
  | { kind: 'unchanged'; key: string; value: ReactNode; rawValue?: string }

/** Whole-row look per kind: background, hover, key text, and the marker in front of the row. */
const ROW_STYLE: Record<
  TagRow['kind'],
  { row: string; hover: string; key: string; marker: string; markerText: string; word: string }
> = {
  added: {
    row: 'bg-green-50',
    hover: 'hover:bg-green-100',
    key: 'text-green-800',
    marker: 'text-green-800',
    markerText: '+',
    word: 'added',
  },
  removed: {
    row: 'bg-red-50',
    hover: 'hover:bg-red-100',
    key: 'text-red-800',
    marker: 'text-red-800',
    markerText: '−',
    word: 'removed',
  },
  changed: {
    row: 'bg-amber-50',
    hover: 'hover:bg-amber-100',
    key: 'text-zinc-800',
    marker: 'text-amber-800',
    markerText: '~',
    word: 'changed',
  },
  renamed: {
    row: 'bg-amber-50',
    hover: 'hover:bg-amber-100',
    key: 'text-zinc-800',
    marker: 'text-amber-800',
    markerText: '→',
    word: 'renamed',
  },
  unchanged: {
    row: '',
    hover: 'hover:bg-zinc-50',
    key: 'text-zinc-800',
    marker: '',
    markerText: '',
    word: '',
  },
}

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
      ? 'text-green-800'
      : row.kind === 'removed'
        ? 'text-red-800 line-through'
        : row.kind === 'renamed'
          ? 'text-zinc-800'
          : ACTION.noop.tagText

  return (
    <div className={clsx(tone, wrap)} dir="auto">
      {row.value}
    </div>
  )
}

/**
 * Icon and name of the signs in a `traffic_sign` value, on their own grid line below the value. Other
 * rows render nothing, and the sign catalogue only loads once a row with a country prefix asks for it.
 */
function TagRowSigns({ row }: { row: TagRowsItem }) {
  const value = trafficSignValueOfRow(row)
  if (value == null || countryPrefixOfValue(value) == null) return null
  return <TrafficSignChips value={value} removed={row.kind === 'removed'} />
}

/**
 * A button per Mapillary or Panoramax photo in the value, on its own grid line below it. Other
 * rows render nothing. The viewer only loads once a photo is opened.
 */
function TagRowPhotos({ row }: { row: TagRowsItem }) {
  return <StreetImageryChips photos={streetImageryPhotosOfRow(row)} />
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

  const { mutations, unchanged } = orderTagRows(rows)
  const ordered = [...mutations, ...unchanged]
  const dividerAt = mutations.length > 0 && unchanged.length > 0 ? mutations.length : -1

  return (
    <dl
      className={clsx(
        '@container/tags grid w-full grid-cols-[auto_auto_auto_auto_minmax(4.5rem,1fr)] font-mono',
        '@min-[16rem]/tags:grid-cols-[auto_auto_auto_auto_minmax(7rem,1fr)]',
        '@min-[20rem]/tags:grid-cols-[auto_auto_auto_auto_minmax(9rem,1fr)]',
        '@min-[24rem]/tags:grid-cols-[auto_auto_auto_auto_minmax(11rem,1fr)]',
        typeScale.small,
        className,
      )}
    >
      {ordered.map((row, index) => {
        const style = ROW_STYLE[row.kind]
        const keys = tagRowKeys(row)
        const highlighted = highlightedKey != null && keys.includes(highlightedKey)
        const noteActive = activeNoteKey != null && keys.includes(activeNoteKey)
        const noteCount = keys.reduce((sum, key) => sum + (noteCountByKey?.[key] ?? 0), 0)
        return (
          <Fragment key={row.key}>
            {index === dividerAt ? (
              <div
                className={clsx(
                  'col-span-5 border-b border-zinc-950/5 px-1 pt-2 pb-0.5 font-sans text-zinc-500',
                  typeScale.small,
                )}
              >
                Unchanged
              </div>
            ) : null}
            <div
              className={clsx(
                'group/tag-row col-span-5 grid grid-cols-subgrid items-center gap-x-1.5 border-b border-zinc-950/5 px-1 py-0.5',
                style.row,
                onKeyClick && ['cursor-pointer touch-manipulation', style.hover],
                // The yellow frame marks the selection; changed rows keep their own background inside it.
                highlighted &&
                  clsx(
                    'inset-ring-2 inset-ring-yellow-400',
                    row.kind === 'unchanged' && 'bg-yellow-50',
                  ),
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
              {/* First in the row: on phones it sits far from the element's own buttons at the right edge. */}
              {onAddNote ? (
                <span
                  className={clsx(
                    'inline-flex',
                    !noteActive &&
                      'pointer-fine:opacity-0 pointer-fine:group-focus-within/tag-row:opacity-100 pointer-fine:group-hover/tag-row:opacity-100',
                  )}
                >
                  <AddNoteButton
                    compact
                    label={noteActive ? `Close note on ${row.key}` : `Add a note on ${row.key}`}
                    pressed={noteActive}
                    onClick={() => onAddNote(row.key)}
                  />
                </span>
              ) : (
                <span aria-hidden />
              )}
              {row.kind === 'unchanged' ? (
                <span aria-hidden />
              ) : (
                <span className={clsx('text-center font-bold select-none', style.marker)}>
                  <span className="sr-only">{style.word} </span>
                  <span aria-hidden>{style.markerText}</span>
                </span>
              )}
              <dt
                className={clsx(
                  'max-w-[8rem] min-w-0 font-medium break-all @min-[20rem]/tags:max-w-[11rem]',
                  style.key,
                )}
                title={row.kind === 'renamed' ? `${row.oldKey} → ${row.key}` : row.key}
              >
                {row.kind === 'renamed' ? (
                  <>
                    <span className="block font-normal text-zinc-500 line-through">
                      <span className="sr-only">from </span>
                      {row.oldKey}
                    </span>
                    <span className="block">
                      {/* The row marker already shows the arrow. */}
                      <span className="sr-only">to </span>
                      {row.key}
                    </span>
                  </>
                ) : (
                  row.key
                )}
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
                  count={noteCount}
                  onNoteCountClick={onNoteCountClick}
                />
              </dd>
              <TagRowSigns row={row} />
              <TagRowPhotos row={row} />
            </div>
          </Fragment>
        )
      })}
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
