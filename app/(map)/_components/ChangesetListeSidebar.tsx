'use client'

import { Badge } from '@components/core/badge'
import { ChatBubbleLeftIcon, HandThumbDownIcon, HandThumbUpIcon } from '@heroicons/react/16/solid'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { clsx } from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { editorShortname } from './utils/editorShortname'
import { relativeTime } from './utils/relativeTime'

type Props = { changesets: any }

export const ChangesetListeSidebar = ({ changesets }: Props) => {
  const currentPath = usePathname()

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <nav className="h-full overflow-y-scroll">
        <ul className="divide-y divide-gray-100">
          {changesets.features.map((changeset: any) => {
            const current = currentPath === `/changesets/${changeset.id}`
            return (
              <li key={changeset.id}>
                <Link
                  href={`/changesets/${changeset.id}`}
                  className={clsx(
                    'relative flex flex-col items-start justify-between gap-1 break-words rounded py-3 pl-3 pr-0',
                    current ? 'bg-gray-100' : 'hover:bg-gray-50',
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-2 pr-1.5 text-xs text-zinc-500">
                    <strong>{editorShortname(changeset.properties.editor)}</strong>
                    <span>
                      <time title={changeset.properties.date}>
                        {relativeTime(changeset.properties.date)}
                      </time>
                      {changeset.properties.comments_count > 0 && (
                        <span>
                          <ChatBubbleLeftIcon className="size-4" />{' '}
                          {changeset.properties.comments_count}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1 text-base">
                    <div className="flex flex-col gap-1">
                      <div className="hyphens-auto leading-tight">
                        <strong>{changeset.properties.user}:</strong> {changeset.properties.comment}
                      </div>

                      {changeset.properties.checked ? (
                        <div>
                          {changeset.properties.harmful ? (
                            <HandThumbDownIcon className="size-4" />
                          ) : (
                            <HandThumbUpIcon className="size-4" />
                          )}{' '}
                          by {changeset.properties.check_user}
                        </div>
                      ) : (
                        <div className="space-x-1">
                          {changeset.properties.reasons?.map(
                            (reason: { id: number; name: string }) => {
                              return <Badge key={reason.id}>{reason.name}</Badge>
                            },
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronRightIcon
                      className="h-5 w-5 flex-none text-gray-400"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </Suspense>
  )
}
