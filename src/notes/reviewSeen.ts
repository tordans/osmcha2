import type { RefParam } from '../routing/refParam.ts'
import { objectRefKey } from './locateNotes.ts'

export const DRAFT_MAX_AGE_MS = 21 * 24 * 60 * 60 * 1000
export const SEEN_LRU_CAP = 40

export type DraftNote = {
  id: string
  body: string
  ref?: RefParam
  pin?: { lat: number; lng: number }
}

export type ChangesetDraft = {
  intro: string
  notes: DraftNote[]
  updatedAt: number
}

export type SeenMap = Record<string, string>

export type UserNotesState = {
  drafts: Record<string, ChangesetDraft>
  seen: Record<string, SeenMap>
  seenTouchedAt: Record<string, number>
}

export function emptyUserNotes(): UserNotesState {
  return { drafts: {}, seen: {}, seenTouchedAt: {} }
}

export function isObjectSeenCollapsed(args: {
  seenAt?: string
  latestForeignNoteAt?: string
}): boolean {
  if (!args.seenAt) return false
  if (!args.latestForeignNoteAt) return true
  return Date.parse(args.seenAt) >= Date.parse(args.latestForeignNoteAt)
}

export function latestForeignNoteAt(
  notes: Array<{ author?: string; date?: string }>,
  currentUser?: string,
): string | undefined {
  let latest: string | undefined
  let latestMs = Number.NEGATIVE_INFINITY
  for (const note of notes) {
    if (!note.date) continue
    if (currentUser && note.author === currentUser) continue
    const ms = Date.parse(note.date)
    if (Number.isNaN(ms)) continue
    if (ms >= latestMs) {
      latestMs = ms
      latest = note.date
    }
  }
  return latest
}

export function draftsForObject(
  draft: ChangesetDraft | undefined,
  type: string,
  id: number,
): DraftNote[] {
  if (!draft) return []
  return draft.notes.filter((note) => note.ref?.type === type && note.ref.id === id)
}

export function changesetIdKey(changesetId: number): string {
  return String(changesetId)
}

export function evictUserNotes(user: UserNotesState, now = Date.now()): UserNotesState {
  const drafts: Record<string, ChangesetDraft> = {}
  for (const [id, draft] of Object.entries(user.drafts)) {
    if (now - draft.updatedAt <= DRAFT_MAX_AGE_MS) drafts[id] = draft
  }

  const touched = Object.entries(user.seenTouchedAt).sort((left, right) => right[1] - left[1])
  const keep = new Set(touched.slice(0, SEEN_LRU_CAP).map(([id]) => id))
  const seen: Record<string, SeenMap> = {}
  const seenTouchedAt: Record<string, number> = {}
  for (const id of keep) {
    if (user.seen[id]) seen[id] = user.seen[id]
    if (user.seenTouchedAt[id] != null) seenTouchedAt[id] = user.seenTouchedAt[id]
  }

  return { ...user, drafts, seen, seenTouchedAt }
}

export function objectKeyFromRef(ref: RefParam): string {
  return objectRefKey(ref.type, ref.id)
}
