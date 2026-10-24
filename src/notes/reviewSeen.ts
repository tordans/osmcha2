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

type SeenMap = Record<string, string>

export type UserNotesState = {
  drafts: Record<string, ChangesetDraft>
  seen: Record<string, SeenMap>
  /**
   * Per changeset: objects the reviewer un-saw although they count as seen by themselves (minor
   * moves). Only these are stored; the automatic seen state is derived, never written to `seen`.
   */
  unseenOverrides: Record<string, string[]>
  seenTouchedAt: Record<string, number>
}

export function emptyUserNotes(): UserNotesState {
  return { drafts: {}, seen: {}, unseenOverrides: {}, seenTouchedAt: {} }
}

/** `seenAt` of an automatically seen object. Older than any note, so a new note reopens the row. */
export const AUTO_SEEN_AT = new Date(0).toISOString()

/**
 * When the object counts as seen, if at all. The reviewer's own mark wins; otherwise a minor move
 * counts as seen unless the reviewer un-saw it. The one place that decides this.
 */
export function effectiveSeenAt(args: {
  seenAt?: string
  minorMove: boolean
  unseenOverride: boolean
}): string | undefined {
  if (args.seenAt) return args.seenAt
  return args.minorMove && !args.unseenOverride ? AUTO_SEEN_AT : undefined
}

/**
 * The stored seen map plus the minor moves that count as seen. Returns `stored` itself when
 * nothing is added, so callers can rely on its identity.
 */
export function effectiveSeenMap(
  stored: SeenMap | undefined,
  unseenOverrides: readonly string[] | undefined,
  minorMoveKeys: readonly string[],
): SeenMap | undefined {
  let merged: SeenMap | undefined
  for (const key of minorMoveKeys) {
    const seenAt = effectiveSeenAt({
      seenAt: stored?.[key],
      minorMove: true,
      unseenOverride: unseenOverrides?.includes(key) ?? false,
    })
    if (seenAt == null || stored?.[key] != null) continue
    merged ??= { ...stored }
    merged[key] = seenAt
  }
  return merged ?? stored
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
  const unseenOverrides: Record<string, string[]> = {}
  const seenTouchedAt: Record<string, number> = {}
  for (const id of keep) {
    if (user.seen[id]) seen[id] = user.seen[id]
    if (user.unseenOverrides[id]) unseenOverrides[id] = user.unseenOverrides[id]
    if (user.seenTouchedAt[id] != null) seenTouchedAt[id] = user.seenTouchedAt[id]
  }

  return { ...user, drafts, seen, unseenOverrides, seenTouchedAt }
}

export function objectKeyFromRef(ref: RefParam): string {
  return objectRefKey(ref.type, ref.id)
}
