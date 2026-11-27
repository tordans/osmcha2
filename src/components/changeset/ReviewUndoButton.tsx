import clsx from 'clsx'
import { useNotesUserKey } from '../../notes/useNotesUserKey.ts'
import { useLastUndo } from '../../stores/changeset-notes-store.ts'
import { useKeyboardKnown, withKeyHint } from '../../utils/hardwareKeys.ts'
import { Button } from '../ui/button.tsx'
import { ArrowUturnLeftIcon } from '../ui/icons.ts'
import { Tooltip } from '../ui/tooltip.tsx'
import { undoReviewStep } from './useReviewCursorKeys.ts'

/** The undo key as the keyboard labels it. */
function undoKeyLabel() {
  return /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘Z' : 'Ctrl+Z'
}

/** Takes back the last seen mark or deleted note; its tooltip says which. Same as Cmd/Ctrl+Z. */
export function ReviewUndoButton({ changesetId }: { changesetId: number }) {
  const userKey = useNotesUserKey()
  const last = useLastUndo(userKey, changesetId)
  const keyboard = useKeyboardKnown()
  const tooltip = last
    ? withKeyHint(`Undo: ${last.label}`, undoKeyLabel(), keyboard)
    : 'Nothing to undo'
  return (
    <Tooltip as="span" placement="bottom-right" content={tooltip} className="ml-auto inline-flex">
      <Button
        plain
        aria-label={last ? `Undo: ${last.label}` : 'Nothing to undo'}
        disabled={!last}
        onClick={() => undoReviewStep(userKey, changesetId)}
        className={clsx(
          'min-h-11 touch-manipulation select-none',
          last ? 'cursor-pointer' : 'pointer-events-none',
        )}
      >
        <ArrowUturnLeftIcon data-slot="icon" className="size-4" />
        Undo
      </Button>
    </Tooltip>
  )
}
