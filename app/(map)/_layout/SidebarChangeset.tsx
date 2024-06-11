'use client'
import { Badge } from '@components/core/badge'
import { HandThumbDownIcon, HandThumbUpIcon } from '@heroicons/react/16/solid'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { clsx } from 'clsx'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ChangesetDescription } from '../_components/Changeset/ChangesetDescription'
import { ChangesetCommentIndicator } from '../_components/Changeset/CommentIndicator'
import { RelativeTime } from '../_components/Changeset/RelativeTime'
import { TOsmChaChangesets } from '../_components/Changeset/zod/OsmChaChangesets.zod'
import { editorShortname } from '../_components/utils/editorShortname'
import { DebugDataHelperDialog } from './DebugDataHelperDialog'
import { localDateTimeWithRelative } from './_utils/localDateTime'

type Props = {
  changeset: TOsmChaChangesets['features'][number]
}

export const SidebarChangeset = ({ changeset }: Props) => {
  const currentPath = usePathname()
  const current = currentPath === `/changesets/${changeset.id}`
  const searchParams = useSearchParams()

  return (
    <li key={changeset.id} className="relative">
      <Link
        href={`/changesets/${changeset.id}?${searchParams.toString()}`}
        className={clsx(
          'group/item relative flex flex-col items-start justify-between gap-1 break-words rounded py-3 pl-3 pr-0',
          current ? 'bg-blue-50' : 'hover:bg-gray-50',
        )}
      >
        <div className="flex w-full items-center justify-between gap-2 pr-1.5 text-xs text-zinc-500">
          <RelativeTime date={changeset.properties.date} />
          <div className="flex items-center gap-2">
            {editorShortname(changeset.properties.editor)}
            <ChangesetCommentIndicator commentCount={changeset.properties.comments_count} />
          </div>
        </div>
        <div className="flex w-full items-center justify-between gap-1 text-base">
          <div className="flex w-full flex-col gap-1">
            <ChangesetDescription changeset={changeset} />

            {changeset.properties.checked ? (
              <div
                title={`Checked on ${localDateTimeWithRelative(changeset.properties.check_date)}`}
              >
                <Badge color={changeset.properties.harmful ? 'orange' : 'green'}>
                  {changeset.properties.harmful ? (
                    <HandThumbDownIcon className="size-4" />
                  ) : (
                    <HandThumbUpIcon className="size-4" />
                  )}{' '}
                  by {changeset.properties.check_user}
                </Badge>
              </div>
            ) : (
              <div className="space-x-1">
                {changeset.properties.reasons?.map((reason: { id: number; name: string }) => {
                  return <Badge key={reason.id}>{reason.name}</Badge>
                })}
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
      <DebugDataHelperDialog data={changeset} title="OSMCha Changeset from OMSCha Changeset List" />
    </li>
  )
}
