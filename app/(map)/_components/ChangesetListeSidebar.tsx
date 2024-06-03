'use client'
import { Badge } from '@components/core/badge'
import { HandThumbDownIcon, HandThumbUpIcon } from '@heroicons/react/16/solid'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { clsx } from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { ChangesetCommentIndicator } from './Changeset/CommentIndicator'
import { RelativeTime } from './Changeset/RelativeTime'
import { TOsmChaChangeset } from './Changeset/zod/OsmChaChangeset.zod'
import { editorShortname } from './utils/editorShortname'

type Props = { changesets: any }

export const ChangesetListeSidebar = ({ changesets }: Props) => {
  const currentPath = usePathname()

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <nav className="group/nav h-full overflow-y-scroll">
        <ul className="divide-y divide-gray-100">
          {changesets.features.map((changeset: TOsmChaChangeset) => {
            const current = currentPath === `/changesets/${changeset.id}`
            return (
              <li key={changeset.id}>
                <Link
                  href={`/changesets/${changeset.id}`}
                  className={clsx(
                    'group/item relative flex flex-col items-start justify-between gap-1 break-words rounded py-3 pl-3 pr-0',
                    current ? 'bg-blue-50' : 'hover:bg-gray-50',
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-2 pr-1.5 text-xs text-zinc-500">
                    <span>
                      <RelativeTime createdAt={changeset.properties.date} />
                      <ChangesetCommentIndicator
                        commentCount={changeset.properties.comments_count}
                      />
                    </span>
                    <span>{editorShortname(changeset.properties.editor)}</span>
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
                      className={clsx(
                        'size-6 flex-none transition-colors duration-150',
                        current
                          ? 'text-blue-500'
                          : 'text-white group-hover/item:!text-blue-500 group-hover/nav:text-zinc-200',
                      )}
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
