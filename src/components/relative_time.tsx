import { formatDistanceToNow } from 'date-fns'
import { formatShortAgo, formatLocalDateTime } from '../utils/datetime.ts'
import { Tooltip } from './ui/tooltip.tsx'

interface RelativeTimeProps {
  datetime: Date
  addSuffix?: boolean
  /** One-letter units, e.g. `14d ago`. */
  short?: boolean
}

export function RelativeTime({ datetime, addSuffix = true, short = false }: RelativeTimeProps) {
  const local = formatLocalDateTime(datetime)
  return (
    <Tooltip content={local} as="span">
      <time dateTime={datetime.toISOString()}>
        {short ? formatShortAgo(datetime) : formatDistanceToNow(datetime, { addSuffix })}
      </time>
    </Tooltip>
  )
}
