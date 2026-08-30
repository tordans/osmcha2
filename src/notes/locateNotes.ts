import { parseDiscussionNotes, type ParsedNote } from './discussionNotes.ts'

export type PublishedNote = ParsedNote & {
  author: string
  date?: string
  postId?: string | number
}

export type ObjectNotes = {
  object: PublishedNote[]
  byKey: Map<string, PublishedNote[]>
}

export type LocatedNotes = {
  changesetNotes: PublishedNote[]
  byObject: Map<string, ObjectNotes>
  unmatched: PublishedNote[]
}

export function objectRefKey(type: string, id: number): string {
  return `${type}/${id}`
}

export function flattenObjectNotes(notes?: ObjectNotes): PublishedNote[] {
  if (!notes) return []
  const tagged: PublishedNote[] = []
  for (const list of notes.byKey.values()) tagged.push(...list)
  return [...notes.object, ...tagged]
}

function emptyLocated(): LocatedNotes {
  return { changesetNotes: [], byObject: new Map(), unmatched: [] }
}

function emptyObjectNotes(): ObjectNotes {
  return { object: [], byKey: new Map() }
}

function objectNotesFor(byObject: Map<string, ObjectNotes>, key: string): ObjectNotes {
  const existing = byObject.get(key)
  if (existing) return existing
  const created = emptyObjectNotes()
  byObject.set(key, created)
  return created
}

function appendByKey(objectNotes: ObjectNotes, key: string, note: PublishedNote) {
  const existing = objectNotes.byKey.get(key)
  if (existing) existing.push(note)
  else objectNotes.byKey.set(key, [note])
}

/**
 * Place parsed discussion notes onto changeset / object / tag / unmatched buckets.
 * Never throws. Comment array order is preserved (OSM oldest-first).
 */
export function locateNotes(
  comments: Array<{ id?: string | number; user?: string; date?: string; text?: string }>,
  options: {
    changesetId: number
    listedObjects: Set<string>
    keysByObject: Map<string, Set<string>>
  },
): LocatedNotes {
  try {
    return locateNotesInner(comments, options)
  } catch {
    return emptyLocated()
  }
}

function locateNotesInner(
  comments: Array<{ id?: string | number; user?: string; date?: string; text?: string }>,
  options: {
    changesetId: number
    listedObjects: Set<string>
    keysByObject: Map<string, Set<string>>
  },
): LocatedNotes {
  const located = emptyLocated()
  if (!Array.isArray(comments) || comments.length === 0) return located

  for (const comment of comments) {
    try {
      placeComment(located, comment, options)
    } catch {
      const fallback = comment.text?.trim()
      if (fallback) located.changesetNotes.push(publishedNote(comment, { body: fallback }))
    }
  }

  return located
}

function placeComment(
  located: LocatedNotes,
  comment: { id?: string | number; user?: string; date?: string; text?: string },
  options: {
    changesetId: number
    listedObjects: Set<string>
    keysByObject: Map<string, Set<string>>
  },
) {
  const parsed = parseDiscussionNotes(comment.text ?? '', { changesetId: options.changesetId })

  if (parsed.intro) {
    located.changesetNotes.push(publishedNote(comment, { body: parsed.intro }))
  }

  for (const note of parsed.notes) {
    const published = publishedNote(comment, note)
    const ref = note.ref
    if (!ref) {
      located.changesetNotes.push(published)
      continue
    }

    const objectKey = objectRefKey(ref.type, ref.id)
    if (!options.listedObjects.has(objectKey)) {
      located.unmatched.push(published)
      continue
    }

    if (ref.key) {
      if (options.keysByObject.get(objectKey)?.has(ref.key)) {
        appendByKey(objectNotesFor(located.byObject, objectKey), ref.key, published)
      } else {
        located.unmatched.push(published)
      }
      continue
    }

    objectNotesFor(located.byObject, objectKey).object.push(published)
  }
}

function publishedNote(
  comment: { id?: string | number; user?: string; date?: string },
  note: ParsedNote,
): PublishedNote {
  const published: PublishedNote = {
    author: comment.user ?? '',
    body: note.body,
  }
  if (comment.date) published.date = comment.date
  if (comment.id !== undefined) published.postId = comment.id
  if (note.ref) published.ref = note.ref
  if (note.pin) published.pin = note.pin
  return published
}
