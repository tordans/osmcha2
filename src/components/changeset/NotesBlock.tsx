import clsx from 'clsx'
import type { MouseEvent, ReactNode } from 'react'
import type { ObjectNotes, PublishedNote } from '../../notes/locateNotes.ts'
import { serializePinParam } from '../../routing/pinParam.ts'
import { serializeRefParam } from '../../routing/refParam.ts'
import { parseOsmDate } from '../../utils/datetime.ts'
import { RelativeTime } from '../relative_time.tsx'
import { LinkifyText } from '../text/LinkifyText.tsx'
import { ChatBubbleLeftIcon } from '../ui/icons.ts'
import { typeScale } from '../ui/typography.ts'
import type { OsmElementType } from './changesetElements.ts'
import { noteThreadDomId } from './noteThreadDom.ts'
import { refParamFromElement, type RefParam } from './refSelection.ts'
import { UserOSMLink } from './user_osm_link.tsx'

function stopRowClick(event: MouseEvent<HTMLElement>) {
  event.stopPropagation()
}

function PinBadge({ pin }: { pin: NonNullable<PublishedNote['pin']> }) {
  return (
    <span className="inline-flex items-center gap-0.5 font-mono text-zinc-500">
      📍 {serializePinParam(pin)}
    </span>
  )
}

function NoteEntry({ note }: { note: PublishedNote }) {
  const commentDate = note.date ? parseOsmDate(note.date) : null
  return (
    <div className={clsx(typeScale.small, 'min-w-0')}>
      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-zinc-600">
        {note.author ? (
          <UserOSMLink userName={note.author} linkClasses="font-medium text-zinc-800 underline">
            {note.author}
          </UserOSMLink>
        ) : null}
        {commentDate ? <RelativeTime datetime={commentDate} /> : null}
        {note.pin ? <PinBadge pin={note.pin} /> : null}
      </div>
      {note.body ? (
        <p className="mt-0.5 break-words text-zinc-800">
          <LinkifyText text={note.body} nl2br />
        </p>
      ) : null}
    </div>
  )
}

function MiniThreadHeader({ label, onClick }: { label: string; onClick?: () => void }) {
  const className = clsx(
    typeScale.small,
    'max-w-full font-mono font-medium break-all text-zinc-800',
    onClick &&
      "relative cursor-pointer bg-transparent p-0 text-left after:absolute after:inset-x-0 after:-inset-y-2.5 after:content-[''] hover:underline",
  )
  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {label}
      </button>
    )
  }
  return <div className={className}>{label}</div>
}

function MiniThread({
  id,
  header,
  notes,
  flash,
  onHeaderClick,
}: {
  id: string
  header: string
  notes: PublishedNote[]
  flash?: boolean
  onHeaderClick?: () => void
}) {
  if (notes.length === 0) return null
  return (
    <div
      id={id}
      className={clsx('rounded-sm px-1 py-1', flash && 'ring-2 ring-zinc-400 ring-offset-1')}
    >
      <MiniThreadHeader label={header} onClick={onHeaderClick} />
      <div className="mt-0.5 flex flex-col gap-1">
        {notes.map((note, index) => (
          <NoteEntry key={`${note.postId ?? 'post'}-${note.date ?? ''}-${index}`} note={note} />
        ))}
      </div>
    </div>
  )
}

function NotesSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2
        className={clsx(
          typeScale.heading,
          'flex items-center gap-1 rounded-sm border border-zinc-950/10 bg-zinc-50 px-2 py-1',
        )}
      >
        <ChatBubbleLeftIcon variant="fill" className="size-4 flex-none" /> {title}
      </h2>
      <div className="flex flex-col gap-1 px-2 py-2">{children}</div>
    </div>
  )
}

export function NotesBlock({
  type,
  id,
  tags,
  notes,
  flashKey,
  selectRef,
}: {
  type: OsmElementType
  id: number
  tags: Array<{ key: string }>
  notes?: ObjectNotes
  flashKey?: string | null
  selectRef: (ref: RefParam | null) => void
}) {
  if (!notes) return null
  const tagThreads = tags
    .map((tag) => ({ key: tag.key, notes: notes.byKey.get(tag.key) ?? [] }))
    .filter((thread) => thread.notes.length > 0)
  if (notes.object.length === 0 && tagThreads.length === 0) return null

  return (
    <div className="w-full border-t border-zinc-950/10 pt-1" onClick={stopRowClick}>
      {notes.object.length > 0 ? (
        <MiniThread
          id={noteThreadDomId(type, id)}
          header={`${type}/${id}`}
          notes={notes.object}
          onHeaderClick={() => {
            const nextRef = refParamFromElement(type, id)
            if (nextRef) selectRef(nextRef)
          }}
        />
      ) : null}
      {tagThreads.map((thread) => (
        <MiniThread
          key={thread.key}
          id={noteThreadDomId(type, id, thread.key)}
          header={thread.key}
          notes={thread.notes}
          flash={flashKey === thread.key}
          onHeaderClick={() => {
            const nextRef = refParamFromElement(type, id, thread.key)
            if (nextRef) selectRef(nextRef)
          }}
        />
      ))}
    </div>
  )
}

export function ChangesetNotesSection({ notes }: { notes: PublishedNote[] }) {
  if (notes.length === 0) return null
  return (
    <NotesSection title="On this changeset">
      {notes.map((note, index) => (
        <NoteEntry key={`${note.postId ?? 'post'}-${note.date ?? ''}-${index}`} note={note} />
      ))}
    </NotesSection>
  )
}

export function OtherNotesSection({ notes }: { notes: PublishedNote[] }) {
  if (notes.length === 0) return null
  return (
    <NotesSection title="Other notes">
      {notes.map((note, index) => {
        const ref = note.ref
        return (
          <div key={`${note.postId ?? 'post'}-${note.date ?? ''}-${index}`} className="min-w-0">
            {ref ? (
              <a
                href={`https://www.openstreetmap.org/${ref.type}/${ref.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(
                  typeScale.small,
                  'font-mono font-medium break-all text-blue-700 underline',
                )}
              >
                {serializeRefParam(ref)}
              </a>
            ) : null}
            <NoteEntry note={note} />
          </div>
        )
      })}
    </NotesSection>
  )
}

export function ChangesNotesHeader({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <p className={clsx(typeScale.small, 'flex items-center gap-1 text-zinc-600')}>
      <ChatBubbleLeftIcon variant="fill" className="size-3.5 flex-none" />
      {count} {count === 1 ? 'note' : 'notes'}
    </p>
  )
}
