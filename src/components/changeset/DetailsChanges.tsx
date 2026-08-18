import { ArrowRightIcon, EyeIcon } from '@heroicons/react/16/solid'
import { ExclamationTriangleIcon, PencilIcon, PlusCircleIcon, TrashIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { Fragment } from 'react'
import { Loading } from '../loading.tsx'
import { Badge } from '../ui/badge.tsx'
import { Button } from '../ui/button.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table.tsx'
import {
  buildElementChanges,
  groupElementChanges,
  mergeFlaggedFeatures,
  type AdiffAction,
  type ElementChange,
  type FlaggedFeature,
  type NamedReason,
} from './changesetElements.ts'
import { DropdownOpenElement } from './DropdownOpenElement.tsx'

const ACTION_LABEL = {
  create: 'Created',
  modify: 'Modified',
  delete: 'Deleted',
} as const

const ACTION_ICON = {
  create: PlusCircleIcon,
  modify: PencilIcon,
  delete: TrashIcon,
} as const

type DetailsChangesProps = {
  adiff?: { actions?: AdiffAction[] } | null
  features?: FlaggedFeature[]
  reviewedFeatures?: Array<{ id?: string; user?: string }>
  reasons?: NamedReason[]
  selected?: AdiffAction | null
  setHighlight: (type: string, id: number, isHighlighted: boolean) => void
  zoomToAndSelect: (type: string, id: number) => void
}

function includesHttp(value: string) {
  return value.includes('http')
}

export function DetailsChanges({
  adiff,
  features = [],
  reviewedFeatures = [],
  reasons = [],
  selected,
  setHighlight,
  zoomToAndSelect,
}: DetailsChangesProps) {
  const flagged = mergeFlaggedFeatures(features, reviewedFeatures)
  const grouped = groupElementChanges(buildElementChanges(adiff?.actions ?? [], flagged, reasons))

  if (!adiff) {
    return <Loading className="pt-10" />
  }

  if (grouped.length === 0) {
    return <p className="px-3 py-6 text-center text-sm text-zinc-500">No element changes in this changeset.</p>
  }

  return (
    <section className="my-2">
      {grouped.map(([actionType, changes]) => {
        const Icon = ACTION_ICON[actionType]
        return (
          <Fragment key={actionType}>
            <h2 className="mx-2 mt-3 flex items-center gap-1 rounded-sm border border-zinc-950/10 bg-zinc-50 px-2 py-1 font-semibold">
              <Icon className="size-4 flex-none" /> {ACTION_LABEL[actionType]}
            </h2>
            <ul>
              {changes.map((change) => (
                <ElementChangeRow
                  key={`${change.type}/${change.id}`}
                  change={change}
                  selected={selected}
                  setHighlight={setHighlight}
                  zoomToAndSelect={zoomToAndSelect}
                />
              ))}
            </ul>
          </Fragment>
        )
      })}
    </section>
  )
}

function isSelected(change: ElementChange, selected?: AdiffAction | null) {
  const element = selected?.new ?? selected?.old
  return element?.type === change.type && element?.id === change.id
}

function ElementChangeRow({
  change,
  selected,
  setHighlight,
  zoomToAndSelect,
}: {
  change: ElementChange
  selected?: AdiffAction | null
  setHighlight: (type: string, id: number, isHighlighted: boolean) => void
  zoomToAndSelect: (type: string, id: number) => void
}) {
  const Icon = ACTION_ICON[change.actionType]
  const currentSelect = isSelected(change, selected)
  const flaggedLabel = [
    change.flagged?.name,
    ...((change.flagged?.reasons ?? []) as string[]),
    change.flagged?.userFlag,
    change.flagged?.note,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <li
        className={clsx(
          'relative flex w-full flex-col items-start justify-between gap-1 rounded px-2 py-2',
          currentSelect ? 'bg-yellow-50' : 'hover:bg-zinc-50 active:bg-zinc-950/5',
        )}
      onMouseEnter={() => setHighlight(change.type, change.id, true)}
      onMouseLeave={() => setHighlight(change.type, change.id, false)}
    >
      <div className="flex w-full items-center justify-between gap-1">
        <h3 className="flex min-w-0 items-center gap-1">
          <Icon className="size-4 flex-none" />
          <span className="truncate">
            {change.type}/{change.id}
          </span>
          {change.version != null ? <span className="text-zinc-400">#{change.version}</span> : null}
        </h3>
        <div className="flex shrink-0 items-center justify-end gap-1">
          {change.flagged ? (
            <button
              type="button"
              title={flaggedLabel || 'Flagged feature'}
              aria-label={`Show flagged ${change.type}/${change.id} on map`}
              onClick={() => zoomToAndSelect(change.type, change.id)}
              className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center touch-manipulation select-none"
            >
              <Badge color="orange" title={flaggedLabel || 'Flagged feature'}>
                <ExclamationTriangleIcon className="size-3.5" />
                {change.flagged.reasons[0] ?? change.flagged.name ?? 'Flagged'}
              </Badge>
            </button>
          ) : null}
          {change.geometry === 'moved' ? <Badge color="yellow">Moved</Badge> : null}
          {change.geometry === 'rewritten' ? <Badge color="yellow">Rewritten</Badge> : null}
          {change.nodeStats ? (
            <span
              className="cursor-help text-xs"
              title={
                Object.values(change.nodeStats).every((value) => value === 0)
                  ? 'Only tagging was changed; no changes to the geometry were made.'
                  : `Changes to this way: ${change.nodeStats.added} nodes added, ${change.nodeStats.modified} nodes modified and ${change.nodeStats.deleted} nodes deleted.`
              }
            >
              <Badge color="blue" rounded="left">
                {change.nodeStats.added}
              </Badge>
              <Badge color="yellow" className="-my-1" rounded="none">
                {change.nodeStats.modified}
              </Badge>
              <Badge color="red" rounded="right">
                {change.nodeStats.deleted}
              </Badge>
            </span>
          ) : null}
          <Button
            outline
            aria-label={`Show ${change.type}/${change.id} on map`}
            onClick={() => zoomToAndSelect(change.type, change.id)}
            className="min-h-11 min-w-11 cursor-pointer p-0 touch-manipulation select-none"
          >
            <EyeIcon data-slot="icon" />
          </Button>
          <DropdownOpenElement type={change.type} id={change.id} lat={change.lat} lon={change.lon} />
        </div>
      </div>
      <div className="w-full border-t font-mono">
        {change.tags.length === 0 ? (
          <p className="px-2 py-2 text-xs text-zinc-500">No tags</p>
        ) : (
          <Table dense bleed className="text-xs whitespace-normal">
            <TableHead className="sr-only">
              <TableRow className="w-full">
                <TableHeader>Key</TableHeader>
                <TableHeader>Value</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {change.tags.map((row) => {
                if (row.kind === 'added') {
                  return (
                    <TableRow key={row.key} className="w-full">
                      <TableCell className="w-32 max-w-32 truncate align-top whitespace-normal" title={row.key}>
                        {row.key}
                      </TableCell>
                      <TableCell
                        dir="auto"
                        className={clsx(
                          'bg-blue-100 align-top whitespace-normal text-blue-700',
                          includesHttp(row.value) ? 'break-all' : 'break-words',
                        )}
                      >
                        {row.value}
                      </TableCell>
                    </TableRow>
                  )
                }
                if (row.kind === 'removed') {
                  return (
                    <TableRow key={row.key} className="w-full">
                      <TableCell className="w-32 max-w-32 truncate align-top whitespace-normal" title={row.key}>
                        {row.key}
                      </TableCell>
                      <TableCell
                        dir="auto"
                        className={clsx(
                          'bg-orange-100 align-top whitespace-normal text-orange-500',
                          includesHttp(row.value) ? 'break-all' : 'break-words',
                        )}
                      >
                        {row.value}
                      </TableCell>
                    </TableRow>
                  )
                }
                if (row.kind === 'changed') {
                  return (
                    <TableRow key={row.key} className="w-full">
                      <TableCell className="w-32 max-w-32 truncate align-top whitespace-normal" title={row.key}>
                        {row.key}
                      </TableCell>
                      <TableCell
                        className={clsx(
                          'bg-yellow-100 align-top whitespace-normal',
                          includesHttp(row.oldValue) || includesHttp(row.newValue) ? 'break-all' : 'break-words',
                        )}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-orange-500" dir="auto">
                            {row.oldValue}
                          </span>{' '}
                          <ArrowRightIcon className="size-3 flex-none" />{' '}
                          <span className="text-green-700" dir="auto">
                            {row.newValue}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                }
                return (
                  <TableRow key={row.key} className="w-full">
                    <TableCell className="w-32 max-w-32 truncate whitespace-normal" title={row.key}>
                      {row.key}
                    </TableCell>
                    <TableCell
                      dir="auto"
                      className={clsx(
                        'align-top whitespace-normal text-zinc-500',
                        includesHttp(row.value) ? 'break-all' : 'break-words',
                      )}
                    >
                      {row.value}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </li>
  )
}
