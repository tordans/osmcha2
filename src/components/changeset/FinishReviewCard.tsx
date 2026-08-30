import { useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { composeDiscussionPost, parseDiscussionNotes } from '../../notes/discussionNotes.ts'
import {
  authenticateOsm,
  fetchOsmUsername,
  osmAuthAuthenticated,
} from '../../notes/osmAuthClient.ts'
import { canUseOsmAuthFromThisBuild, isOsmSandboxAuth } from '../../notes/osmAuthConfig.ts'
import { submitDiscussionPost } from '../../notes/submitDiscussionPost.ts'
import { useNotesUserKey } from '../../notes/useNotesUserKey.ts'
import { changesetDiscussionQueryOptions } from '../../query/options/changeset.ts'
import {
  draftHasUnsentNotes,
  postableDraftNotes,
  useChangesetDraft,
  useChangesetNotesActions,
  useFinishFocusNonce,
} from '../../stores/changeset-notes-store.ts'
import { Button } from '../ui/button.tsx'
import { Textarea } from '../ui/textarea.tsx'
import { typeScale } from '../ui/typography.ts'
import { noteTargetLabel } from './NoteEditor.tsx'
import type { RefParam } from './refSelection.ts'

export function FinishReviewCard({
  changesetId,
  selectRef,
}: {
  changesetId: number
  selectRef: (ref: RefParam | null) => void
}) {
  const userKey = useNotesUserKey()
  const draft = useChangesetDraft(userKey, changesetId)
  const { setIntro, removeDraftNote, setOpenEditor, clearDraft } = useChangesetNotesActions()
  const finishFocusNonce = useFinishFocusNonce()
  const cardRef = useRef<HTMLElement>(null)
  const queryClient = useQueryClient()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [posting, setPosting] = useState(false)
  const [osmUser, setOsmUser] = useState<string | null>(null)
  const notes = postableDraftNotes(draft)
  const intro = draft?.intro ?? ''
  const composed = composeDiscussionPost({
    changesetId,
    intro,
    notes,
  })
  const parsed = parseDiscussionNotes(composed, { changesetId })
  const canPost = canUseOsmAuthFromThisBuild()
  const signedInToOsm = canPost && osmAuthAuthenticated()

  useEffect(
    function scrollFinishIntoView() {
      if (finishFocusNonce === 0) return
      cardRef.current?.scrollIntoView({ block: 'nearest' })
    },
    [finishFocusNonce],
  )

  useEffect(
    function loadOsmUsername() {
      if (!signedInToOsm) return
      let cancelled = false
      void fetchOsmUsername().then((name) => {
        if (!cancelled) setOsmUser(name)
      })
      return function cancelOsmUsername() {
        cancelled = true
      }
    },
    [signedInToOsm],
  )

  async function postToOsm() {
    if (!composed.trim() || posting) return
    setPosting(true)
    const result = await submitDiscussionPost({
      changesetId,
      text: composed,
    })
    setPosting(false)
    if (!result.ok) {
      if (result.reason === 'not-configured') {
        toast.error('OpenStreetMap posting is not configured for this build')
      } else {
        toast.error('Could not post notes', { description: result.message })
      }
      return
    }
    clearDraft(userKey, changesetId)
    setPreviewOpen(false)
    toast.success('Notes posted', {
      description: 'They appear on OSMCha after OSM discussion syncs.',
    })
    void queryClient.invalidateQueries({
      queryKey: changesetDiscussionQueryOptions(changesetId).queryKey,
    })
  }

  async function signInWithOsmAndPost() {
    const authResult = await authenticateOsm().then(
      () => true,
      (error: unknown) => {
        toast.error('OpenStreetMap sign-in did not finish', {
          description: error instanceof Error ? error.message : undefined,
        })
        return false
      },
    )
    if (!authResult) return
    const name = await fetchOsmUsername()
    setOsmUser(name)
    await postToOsm()
  }

  const identity = !canPost
    ? import.meta.env.DEV
      ? 'Local builds post only to the OSM sandbox — set VITE_OSM_OAUTH_CLIENT_ID and sandbox auth URLs.'
      : 'OpenStreetMap posting is not configured.'
    : signedInToOsm
      ? `Will post as ${osmUser ?? 'you'} on OpenStreetMap`
      : 'Sign in with OpenStreetMap to post'

  return (
    <section
      ref={cardRef}
      id="finish-review"
      className="rounded-md border border-zinc-200 bg-zinc-50 p-2.5"
    >
      <h2 className={clsx(typeScale.heading, 'mb-2')}>Post notes</h2>
      <Textarea
        rows={3}
        placeholder="Optional intro for the whole discussion post…"
        value={intro}
        onChange={(event) => setIntro(userKey, changesetId, event.target.value)}
      />
      {notes.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-1">
          {notes.map((note) => (
            <li
              key={note.id}
              className="flex items-start justify-between gap-2 rounded bg-white px-2 py-1"
            >
              <button
                type="button"
                className={clsx('min-w-0 flex-1 cursor-pointer text-left', typeScale.small)}
                onClick={() => {
                  if (note.ref) selectRef(note.ref)
                  setOpenEditor({ changesetId, noteId: note.id })
                }}
              >
                <span className="font-medium">{noteTargetLabel(note)}</span>
                <span className="mt-0.5 line-clamp-2 block text-zinc-600">{note.body}</span>
              </button>
              <Button
                type="button"
                plain
                onClick={() => removeDraftNote(userKey, changesetId, note.id)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={clsx('mt-2 text-zinc-500', typeScale.small)}>
          Notes you add on rows appear here. Pattern-wide remarks go in the intro.
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          outline
          disabled={!composed}
          onClick={() => setPreviewOpen((open) => !open)}
        >
          {previewOpen ? 'Hide preview' : 'Preview'}
        </Button>
        {canPost ? (
          signedInToOsm ? (
            <Button type="button" disabled={!composed || posting} onClick={() => void postToOsm()}>
              {posting ? 'Posting…' : 'Post to OSM'}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={!composed || posting}
              onClick={() => void signInWithOsmAndPost()}
            >
              Sign in with OpenStreetMap & post
            </Button>
          )
        ) : null}
      </div>
      <p className={clsx('mt-2 text-zinc-600', typeScale.small)}>{identity}</p>
      {isOsmSandboxAuth() && import.meta.env.DEV ? (
        <p className={clsx('mt-1 text-amber-800', typeScale.small)}>
          Discussion posts go to the OSM sandbox, not osm.org.
        </p>
      ) : null}
      {previewOpen && composed ? (
        <pre className="mt-2 overflow-x-auto rounded bg-white p-2 whitespace-pre-wrap text-zinc-800">
          {composed}
          {parsed.notes.length > 0 ? (
            <span className="mt-2 block text-zinc-500">
              Parsed as {parsed.notes.length} {parsed.notes.length === 1 ? 'note' : 'notes'}
              {parsed.intro ? ' plus intro' : ''}.
            </span>
          ) : null}
        </pre>
      ) : null}
    </section>
  )
}

export function UnsentNotesBar({
  changesetId,
  onFinish,
}: {
  changesetId: number
  onFinish: () => void
}) {
  const userKey = useNotesUserKey()
  const draft = useChangesetDraft(userKey, changesetId)
  if (!draftHasUnsentNotes(draft)) return null
  const count = postableDraftNotes(draft).length + (draft?.intro.trim() ? 1 : 0)
  return (
    <div className="sticky bottom-0 z-10 border-t border-zinc-200 bg-white/95 px-2.5 py-2 backdrop-blur-sm">
      <button
        type="button"
        className={clsx(
          'flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-md bg-blue-50 px-3 text-left text-blue-800',
          typeScale.small,
        )}
        onClick={onFinish}
      >
        <span>
          {count} unsent {count === 1 ? 'note' : 'notes'} — post them in Changes
        </span>
        <span className="font-medium">Post notes</span>
      </button>
    </div>
  )
}
