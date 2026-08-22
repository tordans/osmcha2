import { Badge } from '../ui/badge.tsx'
import {
  CircleCheckIcon,
  FlagIcon,
  MessageCircleWarningIcon,
} from '../ui/icons.ts'
import { Tooltip } from '../ui/tooltip.tsx'
import {
  hasResolvedTag,
  type NamedTag,
  type ReviewIconKind,
  reviewPresentation,
} from '../changeset/reviewPresentation.ts'

export { hasResolvedTag }

export function ReviewVerdictIcon({
  kind,
  variant = 'fill',
  className = 'size-4',
}: {
  kind: ReviewIconKind
  variant?: 'outline' | 'fill'
  className?: string
}) {
  if (kind === 'circleCheck') {
    return <CircleCheckIcon variant={variant} className={className} />
  }
  if (kind === 'messageWarning') {
    return <MessageCircleWarningIcon variant={variant} className={className} />
  }
  return <FlagIcon variant={variant} className={className} />
}

type ReviewStatusBadgeProps = {
  checked?: boolean
  checkUser?: string | null
  harmful?: boolean | null
  tags?: NamedTag[]
}

export function ReviewStatusBadge({
  checked,
  checkUser,
  harmful,
  tags = [],
}: ReviewStatusBadgeProps) {
  const presentation = reviewPresentation({ checked, harmful, tags, checkUser })
  if (!presentation) return null

  return (
    <Tooltip
      content={presentation.tooltip}
      as="span"
      className="flex-none @[22rem]/list:pointer-events-none"
    >
      <Badge color={presentation.color} className="h-6" aria-label={presentation.tooltip}>
        <ReviewVerdictIcon kind={presentation.icon} />
        <span className="hidden @[22rem]/list:inline">by {checkUser || <i>Unknown user</i>}</span>
      </Badge>
    </Tooltip>
  )
}
