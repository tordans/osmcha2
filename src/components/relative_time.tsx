import { formatDistanceToNow } from 'date-fns'
import { formatLocalDateTime } from '../utils/datetime.ts'
import { Tooltip } from './ui/tooltip.tsx'

interface RelativeTimeProps {
  datetime: Date
  addSuffix?: boolean
}

export function RelativeTime({ datetime, addSuffix = true }: RelativeTimeProps) {
  const local = formatLocalDateTime(datetime)
  return (
    <Tooltip content={local} as="span">
      <time dateTime={datetime.toISOString()}>{formatDistanceToNow(datetime, { addSuffix })}</time>
    </Tooltip>
  )
}
