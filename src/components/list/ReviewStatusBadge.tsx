import { Badge } from '../ui/badge.tsx'
import { HandThumbDownIcon, HandThumbUpIcon } from '../ui/icons.ts'
import { Tooltip } from '../ui/tooltip.tsx'

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
  const label = `Reviewed as ${verdict} by ${reviewer}`

  return (
    <Tooltip content={label} as="span" className="flex-none @[22rem]/list:pointer-events-none">
      <Badge color={reviewBadgeColor({ resolved, harmful })} className="h-6" aria-label={label}>
        {harmful ? (
          <HandThumbDownIcon variant="fill" className="size-4" />
        ) : (
          <HandThumbUpIcon variant="fill" className="size-4" />
        )}
        <span className="hidden @[22rem]/list:inline">by {checkUser || <i>Unknown user</i>}</span>
      </Badge>
    </Tooltip>
  )
}
