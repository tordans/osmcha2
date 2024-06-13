import { TOsmChaRealChangeset } from '@app/(map)/_data/OsmChaRealChangeset.zod'
import { Badge } from '@app/_components/core/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@app/_components/core/table'
import { ArrowRightIcon } from '@heroicons/react/16/solid'
import { PencilIcon, PlusCircleIcon, TrashIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { Fragment } from 'react'
import { DropdownOpenElement } from './Details/DropdownOpenElement'

type Props = { osmChaRealChangeset: TOsmChaRealChangeset | undefined }

const actionTranslation = { create: 'Created', modify: 'Modified', delete: 'Deleted' } as const

export const DetailsChanges = ({ osmChaRealChangeset }: Props) => {
  type Element = TOsmChaRealChangeset['elements'][number] & {
    nodeStats: { added: number; modified: number; deleted: number }
  }
  const elements = structuredClone(osmChaRealChangeset?.elements) as Element[] | undefined

  // For every way, we add a count of nodes that where added, modified or deleted
  // We also delete those notes if they have no own tags, because we don't want to list them separately in this case
  elements?.forEach((element) => {
    if (element.type !== 'way') return
    const nodeStats = { added: 0, modified: 0, deleted: 0 }
    const nodeRefs =
      element.action === 'delete'
        ? // @ts-expect-error our zod types are not precise enough but we know that for action=delete we need to look at the old.nodes
          new Set(element.old.nodes.map((node) => node.ref))
        : new Set(element.nodes.map((node) => node.ref))
    elements.forEach((node) => {
      if (node.type !== 'node') return
      if (!nodeRefs.has(node.id)) return
      if (node.action === 'create') {
        nodeStats.added++
      } else if (node.action === 'modify') {
        nodeStats.modified++
      } else if (node.action === 'delete') {
        nodeStats.deleted++
      }
      delete elements[elements.indexOf(node)]
    })
    element.nodeStats = nodeStats
  })

  // Group changes by action
  const groupedChanges: Map<Element['action'], Element[]> = new Map()
  elements?.forEach((element) => {
    if (!groupedChanges.has(element.action)) {
      groupedChanges.set(element.action, [])
    }
    groupedChanges.get(element.action)!.push(element)
  })
  const groupIcons: Record<Element['action'], React.ReactElement> = {
    create: <PlusCircleIcon className="size-4 flex-none" />,
    modify: <PencilIcon className="size-4 flex-none" />,
    delete: <TrashIcon className="size-4 flex-none" />,
  }

  if (!osmChaRealChangeset) {
    return (
      <span className="flex h-full items-start justify-center pt-10 text-red-500">
        Error loading changeset data
      </span>
    )
  }

  return (
    <section className="my-4">
      {Array.from(groupedChanges).map(([action, changes]) => {
        return (
          <Fragment key={action}>
            <h2 className="mt-5 flex items-center gap-1 rounded-sm border border-zinc-950/10 bg-zinc-50 px-2 py-1 font-semibold">
              {groupIcons[action]} {actionTranslation[action]}
            </h2>
            <ul>
              {changes.map((change) => {
                const current = false // TODO

                const oldTags = change.old?.tags || {}
                const addedTags = Object.entries(change.tags).filter(
                  ([key, _]) => !(key in oldTags),
                )
                const removedTags = Object.entries(oldTags).filter(
                  ([key, _]) => !(key in change.tags),
                )
                const changedTags = Object.entries(change.tags).filter(
                  ([key, _]) => key in oldTags && oldTags[key] !== change.tags[key],
                )
                const unchangedTags = Object.entries(change.tags).filter(
                  ([key, _]) => key in oldTags && oldTags[key] === change.tags[key],
                )

                return (
                  <li key={change.id}>
                    <div
                      className={clsx(
                        'group/item relative flex w-full flex-col items-start justify-between gap-1 rounded px-2 py-2 pr-0',
                        current ? 'bg-blue-50' : 'hover:bg-gray-50',
                      )}
                    >
                      <div className="flex w-full items-center justify-between">
                        <h3 className="flex items-center gap-1">
                          {groupIcons[action]} {change.type}/{change.id}{' '}
                          <span className="text-zinc-400">#{change.version}</span>{' '}
                        </h3>
                        <div className="flex items-center justify-end gap-1">
                          {change.nodeStats && (
                            <span
                              className="cursor-help text-xs"
                              title={
                                Object.values(change.nodeStats).every((v) => v === 0)
                                  ? 'Only tagging was changed; no changes to the geometry where made.'
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
                          )}{' '}
                          <DropdownOpenElement element={change} />
                        </div>
                      </div>
                      <div className="w-full border-t font-mono">
                        <Table dense bleed classNameTable="text-xs">
                          <TableHead className="sr-only">
                            <TableRow className="w-full">
                              <TableHeader>Key</TableHeader>
                              <TableHeader>Value</TableHeader>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {addedTags.map(([key, value]) => (
                              <TableRow key={key} className="w-full">
                                <TableCell className="w-32 max-w-32 truncate align-top" title={key}>
                                  {key}
                                </TableCell>
                                <TableCell
                                  className={clsx(
                                    'bg-blue-100 align-top text-blue-700',
                                    value.includes('http') ? 'break-all' : 'break-words',
                                  )}
                                >
                                  {value}
                                </TableCell>
                              </TableRow>
                            ))}
                            {removedTags.map(([key, _]) => (
                              <TableRow key={key} className="w-full">
                                <TableCell className="w-32 max-w-32 truncate align-top" title={key}>
                                  {key}
                                </TableCell>
                                <TableCell
                                  className={clsx(
                                    'bg-orange-100 align-top text-orange-500',
                                    oldTags[key].includes('http') ? 'break-all' : 'break-words',
                                  )}
                                >
                                  {oldTags[key]}
                                </TableCell>
                              </TableRow>
                            ))}
                            {changedTags.map(([key, value]) => (
                              <TableRow key={key} className="w-full">
                                <TableCell className="w-32 max-w-32 truncate align-top" title={key}>
                                  {key}
                                </TableCell>
                                <TableCell
                                  className={clsx(
                                    'bg-yellow-100 align-top',
                                    oldTags[key].includes('http') || value.includes('http')
                                      ? 'break-all'
                                      : 'break-words',
                                  )}
                                >
                                  <div className="flex items-center gap-1">
                                    <span className="text-orange-500">{oldTags[key]}</span>{' '}
                                    <ArrowRightIcon className="size-3 flex-none" />{' '}
                                    <span className="text-green-700">{value}</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                            {unchangedTags.map(([key, value]) => (
                              <TableRow key={key} className="w-full">
                                <TableCell className="w-32 max-w-32 truncate" title={key}>
                                  {key}
                                </TableCell>
                                <TableCell
                                  className={clsx(
                                    'align-top text-zinc-500',
                                    value.includes('http') ? 'break-all' : 'break-words',
                                  )}
                                >
                                  {value}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </Fragment>
        )
      })}
    </section>
  )
}
