import clsx from 'clsx'
import { Badge } from '../ui/badge.tsx'
import { Tooltip } from '../ui/tooltip.tsx'
import { ACTION, ACTION_UI_COLOR, type ElementActionKey } from './actionColors.ts'

export function ActionIcon({
  action,
  className,
}: {
  action: ElementActionKey
  className?: string
}) {
  const Icon = ACTION[action].icon
  return <Icon variant="fill" className={clsx('size-4 flex-none', className)} />
}

export function ActionTypeLabel({
  actionType,
  muted,
}: {
  actionType: ElementActionKey
  muted?: boolean
}) {
  const label = ACTION[actionType].label
  return (
    <Tooltip as="span" content={label} aria-label={label} className="inline-flex shrink-0">
      <Badge color={muted ? 'zinc' : ACTION_UI_COLOR[actionType]} className="px-1">
        <ActionIcon action={actionType} />
      </Badge>
    </Tooltip>
  )
}
