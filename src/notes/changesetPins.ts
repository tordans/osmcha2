import { useChangesetDiscussion } from '../query/hooks/useChangesetDiscussion.ts'
import type { PinParam } from '../routing/pinParam.ts'
import { useChangesetDraft } from '../stores/changeset-notes-store.ts'
import { parseDiscussionNotes } from './discussionNotes.ts'
import { numberPins, type PinSource } from './pinNumbers.ts'
import { useNotesUserKey } from './useNotesUserKey.ts'

function collectChangesetPinSources(options: {
  changesetId: number
  comments: Array<{ text?: string }>
  draftNotes?: Array<{ id: string; pin?: PinParam }>
}): PinSource[] {
  const published: PinSource[] = []
  for (const comment of options.comments) {
    for (const note of parseDiscussionNotes(comment.text ?? '', {
      changesetId: options.changesetId,
    }).notes) {
      if (note.pin) published.push({ pin: note.pin })
    }
  }
  const drafts: PinSource[] = []
  for (const note of options.draftNotes ?? []) {
    if (note.pin) drafts.push({ pin: note.pin, draft: true, id: note.id })
  }
  return [...published, ...drafts]
}

export function useChangesetNumberedPins(changesetId: number | null) {
  const userKey = useNotesUserKey()
  const draft = useChangesetDraft(userKey, changesetId ?? 0)
  const { data: discussion } = useChangesetDiscussion(changesetId, { pollWhileActive: true })
  if (changesetId == null) return []
  return numberPins(
    collectChangesetPinSources({
      changesetId,
      comments: discussion?.changeset?.comments ?? [],
      draftNotes: draft?.notes,
    }),
  )
}

export function pinNumberForNote(
  numbered: ReturnType<typeof numberPins>,
  noteId: string,
): number | undefined {
  return numbered.find((item) => item.id === noteId)?.number
}
