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
        'flex w-full items-center justify-between gap-2 pr-1.5 text-zinc-500',
        typeScale.small,
      )}
    >
      <RelativeTime datetime={parseChangesetDate(date)} />
      <div className="flex items-center gap-2">
        {editorShortname(editor)}
        <NumberOfComments count={commentsCount} />
      </div>
    </div>
  )
}
