import clsx from 'clsx'
import { parse } from 'date-fns'
import { RelativeTime } from '../relative_time.tsx'
import { typeScale } from '../ui/typography.ts'
import { NumberOfComments } from './comments.tsx'
import { editorShortname } from './editorShortname.ts'

interface TitleProps {
  date: string
  editor?: string | null
  commentsCount?: number
}

function parseChangesetDate(date: string): Date {
  const parsed = parse(date, "yyyy-MM-dd'T'HH:mm:ssX", new Date())
  return Number.isNaN(parsed.getTime()) ? new Date(date) : parsed
}

export function Title({ date, editor, commentsCount }: TitleProps) {
  return (
    <div
      className={clsx(
        'flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-0.5 pr-1.5 text-zinc-500',
        typeScale.small,
      )}
    >
      <span className="shrink-0 whitespace-nowrap">
        <RelativeTime datetime={parseChangesetDate(date)} />
      </span>
      <div className="flex min-w-[min(100%,10rem)] flex-1 items-start justify-end gap-2">
        <span className="line-clamp-2 min-w-0 text-right wrap-anywhere">
          {editorShortname(editor)}
        </span>
        <NumberOfComments count={commentsCount} />
      </div>
    </div>
  )
}
