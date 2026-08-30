import clsx from 'clsx'
import type { MouseEvent, ReactNode } from 'react'
import { TouchTarget } from '../ui/button.tsx'
import { ChatBubbleLeftIcon, EyeIcon } from '../ui/icons.ts'
import { Tooltip } from '../ui/tooltip.tsx'

const iconButtonClassName = clsx(
  'relative isolate inline-flex shrink-0 cursor-pointer touch-manipulation items-center justify-center select-none',
  'focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
)

function toneClassName(pressed: boolean, tone: 'note' | 'seen') {
  if (!pressed) {
    return 'bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 active:bg-zinc-100'
  }
  return tone === 'note'
    ? 'bg-blue-600 text-white active:bg-blue-700'
    : 'bg-zinc-800 text-white active:bg-zinc-900'
}

function ReviewIconButton({
  label,
  tooltip,
  pressed,
  tone,
  grouped,
  compact,
  rounded,
  onClick,
  children,
}: {
  label: string
  tooltip: string
  pressed: boolean
  tone: 'note' | 'seen'
  grouped?: boolean
  compact?: boolean
  rounded: 'md' | 'left' | 'right'
  onClick: () => void
  children: ReactNode
}) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onClick()
  }

  return (
    <Tooltip as="span" placement="bottom-end" content={tooltip} className="inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-pressed={pressed}
        className={clsx(
          iconButtonClassName,
          compact ? 'size-4 rounded' : 'size-6',
          toneClassName(pressed, tone),
          rounded === 'md' && !compact && 'rounded-md border border-zinc-950/10 shadow-sm',
          rounded === 'md' && compact && 'border border-zinc-950/10',
          rounded === 'left' && 'rounded-l-md',
          rounded === 'right' && 'rounded-r-md border-l border-zinc-950/10',
        )}
        onClick={handleClick}
      >
        {grouped ? (
          <>
            <span
              className="absolute inset-x-0 -inset-y-2.5 pointer-fine:hidden"
              aria-hidden="true"
            />
            {children}
          </>
        ) : (
          <TouchTarget>{children}</TouchTarget>
        )}
      </button>
    </Tooltip>
  )
}

export function AddNoteButton({
  label,
  pressed = false,
  compact = false,
  onClick,
}: {
  label: string
  pressed?: boolean
  compact?: boolean
  onClick: () => void
}) {
  return (
    <ReviewIconButton
      label={label}
      tooltip={label}
      pressed={pressed}
      tone="note"
      compact={compact}
      rounded="md"
      onClick={onClick}
    >
      <ChatBubbleLeftIcon
        className={compact ? 'size-3' : 'size-3.5'}
        variant={pressed ? 'fill' : 'outline'}
      />
    </ReviewIconButton>
  )
}

export function MarkSeenButton({
  label,
  pressed = false,
  onClick,
}: {
  label: string
  pressed?: boolean
  onClick: () => void
}) {
  return (
    <ReviewIconButton
      label={label}
      tooltip={label}
      pressed={pressed}
      tone="seen"
      rounded="md"
      onClick={onClick}
    >
      <EyeIcon className="size-3.5" variant={pressed ? 'fill' : 'outline'} />
    </ReviewIconButton>
  )
}

export function ObjectReviewActions({
  objectLabel,
  notePressed,
  seen,
  compact = false,
  onNoteClick,
  onSeenClick,
}: {
  objectLabel: string
  notePressed: boolean
  seen: boolean
  compact?: boolean
  onNoteClick: () => void
  onSeenClick: () => void
}) {
  function handleGroupClick(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation()
  }

  return (
    <div
      role="group"
      aria-label={`Review ${objectLabel}`}
      className="isolate inline-flex rounded-md bg-white shadow-sm ring-1 ring-zinc-950/10"
      onClick={handleGroupClick}
    >
      <ReviewIconButton
        label={notePressed ? `Close note on ${objectLabel}` : `Add a note on ${objectLabel}`}
        tooltip={notePressed ? 'Close note (N)' : 'Add a note (N)'}
        pressed={notePressed}
        tone="note"
        grouped
        compact={compact}
        rounded="left"
        onClick={onNoteClick}
      >
        <ChatBubbleLeftIcon
          className={compact ? 'size-3' : 'size-3.5'}
          variant={notePressed ? 'fill' : 'outline'}
        />
      </ReviewIconButton>
      <ReviewIconButton
        label={seen ? `Mark ${objectLabel} as not seen` : `Mark ${objectLabel} as seen`}
        tooltip={seen ? 'Mark as not seen (S)' : 'Mark as seen (S)'}
        pressed={seen}
        tone="seen"
        grouped
        compact={compact}
        rounded="right"
        onClick={onSeenClick}
      >
        <EyeIcon className={compact ? 'size-3' : 'size-3.5'} variant={seen ? 'fill' : 'outline'} />
      </ReviewIconButton>
    </div>
  )
}
