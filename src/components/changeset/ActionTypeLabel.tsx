import clsx from 'clsx'
import { Tooltip } from '../ui/tooltip.tsx'
import { ACTION, type ElementActionKey } from './actionColors.ts'

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
      <ActionIcon
        action={actionType}
        className={clsx('size-3.5', muted ? 'text-zinc-400' : ACTION[actionType].tagText)}
      />
    </Tooltip>
  )
}
