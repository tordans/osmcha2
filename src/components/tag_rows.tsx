import { ArrowRightIcon } from '@heroicons/react/16/solid'
import clsx from 'clsx'
import type { ReactNode } from 'react'
import { typeScale } from './ui/typography.ts'

export type TagRowsItem =
  | { kind: 'added'; key: string; value: ReactNode; rawValue?: string }
  | { kind: 'removed'; key: string; value: ReactNode; rawValue?: string }
  | { kind: 'changed'; key: string; oldValue: ReactNode; newValue: ReactNode; rawOld?: string; rawNew?: string }
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
    <div
      className={clsx(
        'flex flex-col items-start gap-0.5',
        '@min-[36rem]:flex-row @min-[36rem]:flex-wrap @min-[36rem]:items-center @min-[36rem]:gap-x-1 @min-[36rem]:gap-y-0.5',
      )}
    >
      <span className={clsx('min-w-0 text-orange-500', wrapClass(oldValue, rawOld))} dir="auto">
        {oldValue}
      </span>
      <ArrowRightIcon
        className="size-3 flex-none rotate-90 text-zinc-400 @min-[36rem]:rotate-0"
      />
      <span className={clsx('min-w-0 text-green-700', wrapClass(newValue, rawNew))} dir="auto">
        {newValue}
      </span>
    </div>
  )
}

function TagRowValue({ row }: { row: TagRowsItem }) {
  if (row.kind === 'changed') {
    return (
      <div
        className={clsx(
          'rounded-sm bg-yellow-100 px-1 py-0.5',
          wrapClass(row.oldValue, row.rawOld) === 'break-all' ||
            wrapClass(row.newValue, row.rawNew) === 'break-all'
            ? 'break-all'
            : 'break-words',
        )}
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
      ? 'bg-blue-100 text-blue-700'
      : row.kind === 'removed'
        ? 'bg-orange-100 text-orange-500'
        : 'text-zinc-500'

  return (
    <div className={clsx('rounded-sm px-1 py-0.5', tone, wrap)} dir="auto">
      {row.value}
    </div>
  )
}

export function TagRows({
  rows,
  emptyLabel,
  className,
}: {
  rows: TagRowsItem[]
  emptyLabel?: string
  className?: string
}) {
  if (rows.length === 0) {
    return emptyLabel ? (
      <p className={clsx('px-1 py-1 text-zinc-500', typeScale.small, className)}>{emptyLabel}</p>
    ) : null
  }

  return (
    <dl className={clsx('@container w-full font-mono', typeScale.small, className)}>
      {rows.map((row) => (
        <div
          key={row.key}
          className={clsx(
            'grid grid-cols-1 items-start gap-y-0.5 border-b border-zinc-950/5 py-1',
            '@min-[36rem]:grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)] @min-[36rem]:gap-x-2 @min-[36rem]:gap-y-0',
          )}
        >
          <dt className="min-w-0 font-medium break-all text-zinc-800" title={row.key}>
            {row.key}
          </dt>
          <dd className="min-w-0">
            <TagRowValue row={row} />
          </dd>
        </div>
      ))}
    </dl>
  )
}

