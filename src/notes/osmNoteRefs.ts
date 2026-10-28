/**
 * References to OSM map notes in free text, such as a changeset comment:
 * - URLs: `https://www.openstreetmap.org/note/123`, `osm.org/note/123` (path, query and hash allowed)
 * - plain `note/123`
 * - `note #123`, `Note 123`, `Notiz 123`
 *
 * Plain forms are only matched at a word start and never inside a path of another URL.
 */

type OsmNoteRef = {
  id: number
  /** Index of the first character of the match in the text. */
  start: number
  /** Index after the last character of the match. */
  end: number
  /** The matched text, trailing punctuation excluded. */
  text: string
  kind: 'url' | 'plain'
}

const ID = String.raw`(\d{1,12})(?!\w)`
// Not preceded by something that makes it part of another word, path, mention or address.
const START = String.raw`(?<![\w/.@#-])`

const URL_FORM = String.raw`(?<url>${START}(?:https?:\/\/)?(?:www\.)?(?:openstreetmap|osm)\.org\/note\/${ID}(?:[/?#][^\s<>]*)?)`
const SLASH_FORM = String.raw`(?<slash>${START}note\/${ID})`
const WORD_FORM = String.raw`(?<word>${START}(?:note|notiz)(?:\s+#?|#)${ID})`

const TRAILING_PUNCTUATION = /[.,;:!?)\]}'"]+$/

function noteRefPattern() {
  // New instance per call: a global regex keeps `lastIndex` between uses.
  return new RegExp(`${URL_FORM}|${SLASH_FORM}|${WORD_FORM}`, 'gi')
}

/** All note references in `text`, in order of appearance. Ids are 1 to 12 digits. */
export function findOsmNoteRefs(text: string) {
  const refs: OsmNoteRef[] = []
  for (const match of text.matchAll(noteRefPattern())) {
    // Each alternative has one id group; the first all-digit capture is the id.
    const digits = match.slice(1).find((part) => part != null && /^\d+$/.test(part))
    const id = digits ? Number(digits) : 0
    if (id < 1 || match.index == null) continue
    const raw = match[0]
    const kind = match.groups?.url ? 'url' : 'plain'
    const matched = kind === 'url' ? raw.replace(TRAILING_PUNCTUATION, '') : raw
    refs.push({ id, start: match.index, end: match.index + matched.length, text: matched, kind })
  }
  return refs
}

/** Unique note ids of `text`, in order of first appearance. */
export function osmNoteIds(text: string | null | undefined) {
  if (!text) return []
  return [...new Set(findOsmNoteRefs(text).map((ref) => ref.id))]
}

/** Public page of a note on openstreetmap.org. */
export function osmNoteUrl(id: number) {
  return `https://www.openstreetmap.org/note/${id}`
}

type TextSegment =
  | { type: 'text'; text: string; start: number }
  | { type: 'note'; text: string; start: number; id: number }

/** Cut `text` into plain runs and note references. Joined, the segments equal `text`. */
export function splitByOsmNoteRefs(text: string) {
  const segments: TextSegment[] = []
  let cursor = 0
  for (const ref of findOsmNoteRefs(text)) {
    if (ref.start > cursor)
      segments.push({ type: 'text', text: text.slice(cursor, ref.start), start: cursor })
    segments.push({ type: 'note', text: ref.text, start: ref.start, id: ref.id })
    cursor = ref.end
  }
  if (cursor < text.length) segments.push({ type: 'text', text: text.slice(cursor), start: cursor })
  return segments
}
