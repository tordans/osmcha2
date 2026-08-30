import clsx from 'clsx'
import { pinNumberForNote, useChangesetNumberedPins } from '../../notes/changesetPins.ts'
import type { DraftNote } from '../../notes/reviewSeen.ts'
import { useNotesUserKey } from '../../notes/useNotesUserKey.ts'
import { serializePinParam } from '../../routing/pinParam.ts'
import { serializeRefParam } from '../../routing/refParam.ts'
import { useChangesetNotesActions, usePinPlacement } from '../../stores/changeset-notes-store.ts'
import { Badge, BadgeButton } from '../ui/badge.tsx'
import { MapPinIcon } from '../ui/icons.ts'
import { Textarea } from '../ui/textarea.tsx'
import { typeScale } from '../ui/typography.ts'
import { RemovablePinBadge } from './PinNumberBadge.tsx'

export function NoteEditor({
  changesetId,
  note,
  autoFocus = false,
}: {
  changesetId: number
  note: DraftNote
  autoFocus?: boolean
}) {
  const userKey = useNotesUserKey()
  const pinPlacement = usePinPlacement()
  const numberedPins = useChangesetNumberedPins(changesetId)
  const pinNumber = pinNumberForNote(numberedPins, note.id)
  const { upsertDraftNote, setPinPlacement, clearPin } = useChangesetNotesActions()
  const placing = pinPlacement?.noteId === note.id && pinPlacement.changesetId === changesetId

  return (
    <div
      className="w-full rounded-md border border-zinc-200 bg-white p-2"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mb-1.5 flex flex-wrap items-center gap-1">
        {note.ref ? (
          <>
            <span className={clsx('font-mono', typeScale.small)}>
              {note.ref.type}/{note.ref.id}
            </span>
            {note.ref.key ? <Badge className="font-mono">{note.ref.key}</Badge> : null}
          </>
        ) : (
          <span className={clsx(typeScale.small, 'text-zinc-500')}>This changeset</span>
        )}
        {note.pin ? (
          <RemovablePinBadge
            number={pinNumber ?? undefined}
            onRemove={() => clearPin(userKey, changesetId, note.id)}
          />
        ) : (
          <BadgeButton
            color={placing ? 'blue' : 'zinc'}
            aria-pressed={placing}
            aria-label={placing ? 'Cancel pin' : 'Place pin'}
            className="h-7 cursor-pointer touch-manipulation select-none"
            onClick={() =>
              setPinPlacement(placing ? null : { changesetId, noteId: note.id, userKey })
            }
          >
            <MapPinIcon className="size-3.5" />
            {placing ? 'Cancel' : 'Place pin'}
          </BadgeButton>
        )}
      </div>
      <Textarea
        autoFocus={autoFocus}
        rows={3}
        placeholder="Write a note for this object…"
        value={note.body}
        onChange={(event) =>
          upsertDraftNote(userKey, changesetId, { ...note, body: event.target.value })
        }
      />
      {placing ? (
        <p className={clsx('mt-2 text-zinc-600', typeScale.small)}>
          Click the map to place this pin, or use Set pin here on small screens.
        </p>
      ) : null}
      {note.pin && !placing ? (
        <p className={clsx('mt-2 text-zinc-600', typeScale.small)}>
          Drag the numbered pin on the map to move it. It stays movable until you post.
        </p>
      ) : null}
    </div>
  )
}

export function noteTargetLabel(note: DraftNote) {
  if (!note.ref) return note.pin ? `Pin ${serializePinParam(note.pin)}` : 'Changeset'
  return note.ref.key
    ? `${serializeRefParam({ type: note.ref.type, id: note.ref.id })} › ${note.ref.key}`
    : serializeRefParam(note.ref)
}
