'use client'
import { TOsmChaChangesets } from '@app/(map)/_data/OsmChaChangesets.zod'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { clsx } from 'clsx'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { BadgeCheckedBy } from '../Changeset/BadgeCheckedBy'
import { BadgesReasons } from '../Changeset/BadgesReasons'
import { BadgesTags } from '../Changeset/BadgesTags'
import { ChangesetDescription } from '../Changeset/ChangesetDescription'
import { ChangesetCommentIndicator } from '../Changeset/CommentIndicator'
import { RelativeTime } from '../Changeset/RelativeTime'
import { DebugDataHelperDialog } from '../debugHelper/DebugDataHelperDialog'
import { editorShortname } from '../utils/editorShortname'

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
              <BadgeCheckedBy
                checkDate={changeset.properties.check_date}
                harmful={changeset.properties.harmful}
                user={changeset.properties.check_user}
              />
            ) : (
              <BadgesReasons reasons={changeset.properties.tags} />
            )}

            {/* We hide the whole box when id=9/"Resolved" is present because then the tags don't add too much information to the overview list. All data is visible in the <DetailsHeader> */}
            {!changeset.properties.tags.some((t) => t.id === 9) && (
              <BadgesTags tags={changeset.properties.tags} />
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
