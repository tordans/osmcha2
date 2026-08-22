import clsx from 'clsx'
import { parseOsmDate } from '../../utils/datetime.ts'
import { RelativeTime } from '../relative_time.tsx'
import { typeScale } from '../ui/typography.ts'
import { NumberOfComments } from './comments.tsx'
import { editorShortname } from './editorShortname.ts'
import { ReviewStatusBadge } from './ReviewStatusBadge.tsx'

interface TitleProps {
  date: string
  editor?: string | null
  commentsCount?: number
  checked?: boolean
  checkUser?: string | null
  harmful?: boolean | null
  tags?: Array<{ id?: number; name: string }>
}

export function Title({
  date,
  editor,
  commentsCount,
  checked,
  checkUser,
  harmful,
  tags = [],
}: TitleProps) {
  return (
    <div
      className={clsx(
        'flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-0.5 pr-1.5 text-zinc-500',
        typeScale.small,
      )}
    >
      <span className="shrink-0 whitespace-nowrap">
        <RelativeTime datetime={parseOsmDate(date)} />
      </span>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        <span className="line-clamp-2 min-w-0 text-right wrap-anywhere">
          {editorShortname(editor)}
        </span>
        <NumberOfComments count={commentsCount} />
        <ReviewStatusBadge checked={checked} checkUser={checkUser} harmful={harmful} tags={tags} />
      </div>
    </div>
  )
}
