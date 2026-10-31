import { objectRefKey, type ObjectNotes, type PublishedNote } from './locateNotes.ts'

/** A note about a whole "Same tag changes" group carries its size; see `NoteTarget.group`. */
function isGroupNote(note: { group?: number }): boolean {
  return note.group != null
}

/**
 * The object's notes without the group notes, which the group panel shows. Returns `notes` itself
 * when it holds none, so callers can rely on its identity.
 */
export function withoutGroupNotes(notes: ObjectNotes | undefined): ObjectNotes | undefined {
  if (!notes) return notes
  let hasGroupNote = false
  for (const list of notes.byKey.values()) {
    if (list.some(isGroupNote)) hasGroupNote = true
  }
  if (!hasGroupNote) return notes
  const byKey = new Map<string, PublishedNote[]>()
  for (const [key, list] of notes.byKey) {
    const kept = list.filter((note) => !isGroupNote(note))
    if (kept.length > 0) byKey.set(key, kept)
  }
  return { object: notes.object, byKey }
}

export type GroupThread = { key: string; notes: PublishedNote[] }

function dateMs(note: PublishedNote): number {
  return note.date ? Date.parse(note.date) : Number.NaN
}

/**
 * The group notes of a group's members, one thread per tag key in the order the keys first appear.
 * Notes that come from several members (a regrouped list) are merged oldest first.
 */
export function collectGroupThreads(
  members: ReadonlyArray<{ type: string; id: number }>,
  notesByObject: ReadonlyMap<string, ObjectNotes>,
): GroupThread[] {
  const threads = new Map<string, PublishedNote[]>()
  for (const member of members) {
    const notes = notesByObject.get(objectRefKey(member.type, member.id))
    if (!notes) continue
    for (const [key, list] of notes.byKey) {
      const flagged = list.filter(isGroupNote)
      if (flagged.length === 0) continue
      const thread = threads.get(key)
      if (thread) thread.push(...flagged)
      else threads.set(key, [...flagged])
    }
  }
  return [...threads].map(([key, notes]) => ({
    key,
    notes: notes.every((note) => !Number.isNaN(dateMs(note)))
      ? notes.toSorted((left, right) => dateMs(left) - dateMs(right))
      : notes,
  }))
}

/** `man_made · 2 objects`: the tag a group note is about and how many objects it covers. */
export function groupNoteTargetLabel(key: string, memberCount: number): string {
  return `${key} · ${memberCount} objects`
}
