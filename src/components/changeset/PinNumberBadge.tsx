import clsx from 'clsx'
import { Badge, BadgeButton } from '../ui/badge.tsx'
import { MapPinIcon, XMarkIcon } from '../ui/icons.ts'

export function PinNumberBadge({
  number,
  draft,
  className,
}: {
  number: number
  draft?: boolean
  className?: string
}) {
  return (
    <span
      className={clsx(
        'inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold text-white',
        draft ? 'bg-blue-600' : 'bg-zinc-800',
        className,
      )}
      aria-label={draft ? `Draft pin ${number}` : `Pin ${number}`}
    >
      {number}
    </span>
  )
}

/** Number + remove, one pill — same pattern as dismissible review tags. */
export function RemovablePinBadge({ number, onRemove }: { number?: number; onRemove: () => void }) {
  const label = number != null ? `Draft pin ${number}` : 'Draft pin'
  return (
    <div
      className={clsx(
        'isolate inline-flex h-7 min-w-0 flex-none items-stretch whitespace-nowrap',
        'divide-x divide-black/10 overflow-hidden rounded-md ring-1 ring-black/10',
      )}
    >
      <Badge
        color="blue"
        rounded="none"
        className="h-full rounded-none font-semibold tabular-nums"
        aria-label={label}
      >
        <MapPinIcon className="size-3.5" />
        {number}
      </Badge>
      <BadgeButton
        color="blue"
        rounded="none"
        aria-label="Remove pin"
        onClick={onRemove}
        className="h-full min-h-0 min-w-7 cursor-pointer touch-manipulation items-stretch justify-center rounded-none select-none"
      >
        <XMarkIcon className="size-3.5" />
      </BadgeButton>
    </div>
  )
}
