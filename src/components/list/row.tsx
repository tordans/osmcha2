import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { getRouteApi, Link } from '@tanstack/react-router'
import clsx from 'clsx'
import { searchWithoutMap } from '../../routing/mapParam.ts'
import { DebugDataHelperDialog } from '../debug/DebugDataHelperDialog.tsx'
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
  data?: unknown
  inputRef?: (node: HTMLElement | null) => void
}

export function Row({ properties, changesetId, data, active, inputRef }: RowProps) {
  const search = rootRouteApi.useSearch()
  const editor = properties.editor || properties.created_by

  return (
    <li className="relative" ref={inputRef}>
      <Link
        to="/changesets/$id"
        params={{ id: changesetId }}
        search={(prev) => searchWithoutMap({ ...prev, ...search })}
        className={clsx(
          'relative flex min-h-11 flex-col items-start justify-between gap-1 rounded pt-2.5 pr-0.5 pb-2 pl-3 break-words',
          'cursor-pointer touch-manipulation select-none',
          active ? 'bg-blue-50 active:bg-blue-100' : 'hover:bg-gray-50 active:bg-zinc-100',
        )}
      >
        <Title
          date={properties.date ?? ''}
          editor={editor}
          commentsCount={properties.comments_count}
        />
        <div className="flex w-full items-center justify-between gap-1 text-base">
          <div className="flex w-full flex-col gap-2">
            <PrimaryLine user={properties.user} uid={properties.uid} comment={properties.comment} />
            <SecondaryLine
              checked={properties.checked}
              checkUser={properties.check_user}
              harmful={properties.harmful}
              reasons={properties.reasons}
              tags={properties.tags}
            />
          </div>
          <ChevronRightIcon
            className={clsx('size-6 flex-none', active ? 'text-blue-500' : 'text-zinc-300')}
            aria-hidden="true"
          />
        </div>
      </Link>
      <DebugDataHelperDialog
        data={data ?? { id: changesetId, properties }}
        title="OSMCha Changeset from OSMCha Changeset List"
      />
    </li>
  )
}
