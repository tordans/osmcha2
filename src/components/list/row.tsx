import { getRouteApi } from '@tanstack/react-router'
import clsx from 'clsx'
import { useReviewAreaOverlap } from '../../hooks/useReviewArea.ts'
import { searchWithoutMap } from '../../routing/mapParam.ts'
import { RouterLink } from '../../routing/RouterLink.tsx'
import { useIsChangesetRead } from '../../stores/read-changesets-store.ts'
import { DebugDataHelperDialog } from '../debug/DebugDataHelperDialog.tsx'
import { Badge } from '../ui/badge.tsx'
import { ChevronRightIcon, MapPinIcon } from '../ui/icons.ts'
import { typeScale } from '../ui/typography.ts'
import { PrimaryLine } from './primary_line.tsx'
import { SecondaryLine } from './secondary_line.tsx'
import { Title } from './title.tsx'

const rootRouteApi = getRouteApi('__root__')

interface RowProps {
  properties: {
    user?: string
    uid?: number | string
    date?: string
    editor?: string | null
    created_by?: string | null
    comment?: string | null
    comments_count?: number
    checked?: boolean
    check_user?: string | null
    harmful?: boolean | null
    reasons?: Array<{ id?: number; name: string }>
    tags?: Array<{ id?: number; name: string }>
  }
  active?: boolean
  changesetId: number
  /** The changeset bbox polygon from the list API. */
  geometry?: unknown
  data?: unknown
  inputRef?: (node: HTMLElement | null) => void
}

export function Row({ properties, changesetId, geometry, data, active, inputRef }: RowProps) {
  const search = rootRouteApi.useSearch()
  const editor = properties.editor || properties.created_by
  const isRead = useIsChangesetRead(changesetId)
  const outsideReviewArea = useReviewAreaOverlap(changesetId, geometry) === 'outside'

  return (
    <li className="relative" ref={inputRef}>
      <RouterLink
        to="/changesets/$id"
        params={{ id: changesetId }}
        search={(prev) => searchWithoutMap({ ...prev, ...search })}
        aria-current={active ? 'page' : undefined}
        className={clsx(
          'relative flex min-h-11 flex-col items-start justify-between gap-1 rounded pt-2.5 pr-0.5 pb-2 pl-3 break-words',
          'cursor-pointer touch-manipulation select-none',
          active
            ? 'bg-blue-100 active:bg-blue-200'
            : isRead
              ? 'bg-zinc-100 hover:bg-zinc-200/70 active:bg-zinc-200'
              : 'hover:bg-gray-50 active:bg-zinc-100',
        )}
      >
        {outsideReviewArea ? (
          <Badge color="amber" className="-ml-0.5">
            <MapPinIcon className="size-4" aria-hidden="true" />
            Outside your review area
          </Badge>
        ) : null}
        <div className={clsx('flex w-full flex-col gap-1', outsideReviewArea && 'opacity-55')}>
          <Title
            date={properties.date ?? ''}
            editor={editor}
            commentsCount={properties.comments_count}
            checked={properties.checked}
            checkUser={properties.check_user}
            harmful={properties.harmful}
            tags={properties.tags}
          />
          <div className={clsx('flex w-full items-center justify-between gap-1', typeScale.body)}>
            <div className="flex w-full flex-col gap-2">
              <PrimaryLine
                user={properties.user}
                uid={properties.uid}
                comment={properties.comment}
              />
              <SecondaryLine
                checked={properties.checked}
                reasons={properties.reasons}
                tags={properties.tags}
              />
            </div>
            <ChevronRightIcon
              className={clsx('size-6 flex-none', active ? 'text-blue-500' : 'text-zinc-300')}
              aria-hidden="true"
            />
          </div>
        </div>
      </RouterLink>
      <DebugDataHelperDialog
        data={data ?? { id: changesetId, properties }}
        title="this changeset from the list"
      />
    </li>
  )
}
