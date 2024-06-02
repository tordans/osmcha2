import { TOsmChaRealChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaRealChangeset.zod'
import clsx from 'clsx'
import { Fragment } from 'react'
import { DetailsChangesOpenElement } from './DetailsChangesOpenElement'

type Props = { osmChaRealChangeset: TOsmChaRealChangeset }

const actionTranslation = { create: 'Created', modify: 'Modified', delete: 'Deleted' } as const

export const DetailsChanges = ({ osmChaRealChangeset }: Props) => {
  const groupedChanges: Map<
    (typeof osmChaRealChangeset.elements)[number]['action'],
    (typeof osmChaRealChangeset.elements)[number][]
  > = new Map()

  for (const change of osmChaRealChangeset.elements) {
    if (!groupedChanges.has(change.action)) {
      groupedChanges.set(change.action, [])
    }
    groupedChanges.get(change.action)!.push(change)
  }

  return (
    <section className="my-4">
      {Array.from(groupedChanges).map(([action, changes]) => {
        return (
          <Fragment key={action}>
            <h2 className="px-2 font-semibold">{actionTranslation[action]}</h2>
            <ul>
              {changes.map((change) => {
                const current = false // TODO
                return (
                  <li key={change.id}>
                    <div
                      className={clsx(
                        'group/item relative flex w-full flex-col items-start justify-between gap-1 break-words rounded px-2 py-2 pr-0',
                        current ? 'bg-blue-50' : 'hover:bg-gray-50',
                      )}
                    >
                      <div className="flex w-full items-center justify-between">
                        <h3>
                          {change.type}/{change.id}
                        </h3>
                        <DetailsChangesOpenElement element={change} />
                      </div>
                      <div className="text-sm">
                        <p>Version {change.version}</p>
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
