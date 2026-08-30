import clsx from 'clsx'
import { useAuth } from '../../hooks/useAuth.ts'
import {
  parseDiscussionNotes,
  type NoteTarget,
  type ParsedDiscussionPost,
  type ParsedNote,
} from '../../notes/discussionNotes.ts'
import { serializePinParam } from '../../routing/pinParam.ts'
import { useChangesetNotesActions, useDiscussionRaw } from '../../stores/changeset-notes-store.ts'
import { parseOsmDate } from '../../utils/datetime.ts'
import { DebugDataHelperDialog } from '../debug/DebugDataHelperDialog.tsx'
import { RelativeTime } from '../relative_time.tsx'
import { LinkifyText } from '../text/LinkifyText.tsx'
import { Badge } from '../ui/badge.tsx'
import { ChatBubbleLeftIcon } from '../ui/icons.ts'
import { typeScale } from '../ui/typography.ts'
import { CommentForm } from './comment.tsx'
import { SignInButton } from './sign_in_button.tsx'
import TranslateButton from './translate_button.tsx'
import { UserOSMLink } from './user_osm_link.tsx'

type DiscussionsProps = {
  discussions: any[]
  changesetId: number
  changesetAuthor: string
  changesetIsHarmful: boolean
  revealRef: (target: NoteTarget) => void
}

function Discussions({
  discussions,
  changesetId,
  changesetAuthor,
  changesetIsHarmful,
  revealRef,
}: DiscussionsProps) {
  const { token, user } = useAuth()
  const discussionRaw = useDiscussionRaw()
  const { setDiscussionRaw } = useChangesetNotesActions()

  return (
    <section className="p-2.5">
      <div
        role="group"
        aria-label="Discussion layout"
        className="mb-3 flex rounded-lg bg-zinc-100 p-0.5"
      >
        <button
          type="button"
          aria-pressed={!discussionRaw}
          className={clsx(
            'min-h-11 flex-1 cursor-pointer touch-manipulation rounded-md px-3 text-sm font-medium select-none',
            !discussionRaw ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-600',
          )}
          onClick={() => setDiscussionRaw(false)}
        >
          Interpreted
        </button>
        <button
          type="button"
          aria-pressed={discussionRaw}
          className={clsx(
            'min-h-11 flex-1 cursor-pointer touch-manipulation rounded-md px-3 text-sm font-medium select-none',
            discussionRaw ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-600',
          )}
          onClick={() => setDiscussionRaw(true)}
        >
          Raw
        </button>
      </div>

      {discussions.length === 0 ? (
        <p className="w-full p-5 text-center text-zinc-500">No discussion posts, yet</p>
      ) : (
        discussions.map((post, index) => {
          const isChangesetUser = post.user === changesetAuthor
          const postDate = post.date ? parseOsmDate(post.date) : null
          const text = post.text ?? ''
          const parsed = parseDiscussionNotes(text, { changesetId })
          const showInterpreted = !discussionRaw && parsed.notes.length > 0
          return (
            <div
              key={post.id ?? `${post.user}-${post.date}-${index}`}
              className="relative mb-4 border-b border-b-zinc-100 pb-4 last:border-b-0"
            >
              <TranslateButton text={text} />
              <h4 className="flex items-center gap-1 pr-4 font-semibold text-zinc-700">
                <ChatBubbleLeftIcon variant="fill" className="size-4 flex-none" />
                <span>
                  Post by{' '}
                  <UserOSMLink userName={post.user} linkClasses="text-blue-700 underline">
                    {post.user}
                  </UserOSMLink>{' '}
                  {isChangesetUser ? (
                    <span className="font-normal text-zinc-400">(changeset author)</span>
                  ) : null}{' '}
                  {postDate ? <RelativeTime datetime={postDate} /> : null}:
                </span>
              </h4>
              {showInterpreted ? (
                <InterpretedPostBody parsed={parsed} revealRef={revealRef} />
              ) : (
                <p className="mt-1 border-l-2 border-l-zinc-200 py-1 pl-2 break-words">
                  <LinkifyText text={text} nl2br />
                </p>
              )}
              <DebugDataHelperDialog data={post} title="this discussion post" />
            </div>
          )
        })
      )}

      {token ? (
        <div className="my-3">
          <CommentForm
            key={changesetId}
            changesetId={changesetId}
            changesetIsHarmful={changesetIsHarmful}
            discussions={discussions}
            token={token}
            userDetails={user ?? {}}
          />
        </div>
      ) : (
        <div className="flex justify-center py-4">
          <SignInButton text="Sign in to post a discussion" />
        </div>
      )}
    </section>
  )
}

function InterpretedPostBody({
  parsed,
  revealRef,
}: {
  parsed: ParsedDiscussionPost
  revealRef: (target: NoteTarget) => void
}) {
  return (
    <div className="mt-1 flex flex-col gap-2">
      {parsed.intro ? (
        <p className="border-l-2 border-l-zinc-200 py-1 pl-2 break-words">
          <LinkifyText text={parsed.intro} nl2br />
        </p>
      ) : null}
      {parsed.notes.map((note, index) => (
        <InterpretedNoteGroup
          key={noteGroupKey(note, index)}
          note={note}
          onReveal={() => revealRef(note)}
        />
      ))}
    </div>
  )
}

function InterpretedNoteGroup({ note, onReveal }: { note: ParsedNote; onReveal: () => void }) {
  return (
    <div className="rounded-md border border-zinc-200">
      <button
        type="button"
        aria-label={noteRevealLabel(note)}
        onClick={onReveal}
        className="flex min-h-11 w-full cursor-pointer touch-manipulation flex-wrap items-center gap-1 px-2 py-1 text-left select-none hover:bg-zinc-50 active:bg-zinc-950/5"
      >
        {note.ref ? (
          <>
            <span className={clsx('font-mono', typeScale.small)}>
              {note.ref.type}/{note.ref.id}
            </span>
            {note.ref.key ? <Badge className="font-mono">{note.ref.key}</Badge> : null}
          </>
        ) : null}
        {note.pin ? (
          <span className={clsx('font-mono text-zinc-500', typeScale.small)}>
            📍 {serializePinParam(note.pin)}
          </span>
        ) : null}
      </button>
      {note.body ? (
        <div className="border-t border-zinc-100 px-2 py-1 break-words">
          <LinkifyText text={note.body} nl2br />
        </div>
      ) : null}
    </div>
  )
}

function noteGroupKey(note: ParsedNote, index: number) {
  const ref = note.ref ? `${note.ref.type}/${note.ref.id}/${note.ref.key ?? ''}` : 'changeset'
  const pin = note.pin ? serializePinParam(note.pin) : ''
  return `${index}-${ref}-${pin}`
}

function noteRevealLabel(note: ParsedNote) {
  const parts: string[] = []
  if (note.ref) {
    parts.push(
      note.ref.key
        ? `${note.ref.type}/${note.ref.id} ${note.ref.key}`
        : `${note.ref.type}/${note.ref.id}`,
    )
  }
  if (note.pin) parts.push(`pin ${serializePinParam(note.pin)}`)
  return `Show ${parts.join(', ')} on Changes`
}

export { Discussions }
