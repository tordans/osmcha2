import { formatDistanceToNow } from 'date-fns'
import { formatCompactAgo, formatLocalDateTime } from '../utils/datetime.ts'
import { Tooltip } from './ui/tooltip.tsx'

interface RelativeTimeProps {
  datetime: Date
  addSuffix?: boolean
  /** Short units, e.g. `14d ago`. */
  compact?: boolean
}

export function RelativeTime({ datetime, addSuffix = true, compact = false }: RelativeTimeProps) {
  const local = formatLocalDateTime(datetime)
  return (
    <Tooltip content={local} as="span">
      <time dateTime={datetime.toISOString()}>
        {compact ? formatCompactAgo(datetime) : formatDistanceToNow(datetime, { addSuffix })}
      </time>
    </Tooltip>
  )
}
