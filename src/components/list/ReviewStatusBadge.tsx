import { HandThumbDownIcon, HandThumbUpIcon } from '@heroicons/react/16/solid'
import { Badge } from '../ui/badge.tsx'

type NamedTag = { id?: number; name: string }

const RESOLVED_TAG_ID = 9

export function hasResolvedTag(tags: NamedTag[] = []) {
  return tags.some((tag) => tag.id === RESOLVED_TAG_ID)
}

function reviewBadgeColor({ resolved, harmful }: { resolved: boolean; harmful?: boolean | null }) {
  return resolved ? 'green' : harmful ? 'orange' : 'green'
}

type ReviewStatusBadgeProps = {
  checked?: boolean
  checkUser?: string | null
  harmful?: boolean | null
  resolved?: boolean
}

export function ReviewStatusBadge({
  checked,
  checkUser,
  harmful,
  resolved = false,
}: ReviewStatusBadgeProps) {
  if (!checked) return null

  const reviewer = checkUser || 'Unknown user'
  const verdict = harmful ? 'harmful' : 'good'

  return (
    <Badge
      color={reviewBadgeColor({ resolved, harmful })}
      className="flex-none"
      title={`Reviewed as ${verdict} by ${reviewer}`}
      aria-label={`Reviewed as ${verdict} by ${reviewer}`}
    >
      {harmful ? <HandThumbDownIcon className="size-4" /> : <HandThumbUpIcon className="size-4" />}
      <span className="hidden @[22rem]/list:inline">by {checkUser || <i>Unknown user</i>}</span>
    </Badge>
  )
}
