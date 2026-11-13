/**
 * References to OSM changesets in free text, such as a changeset comment or a discussion post:
 * - URLs: `https://www.openstreetmap.org/changeset/123`, `osm.org/changeset/123` (path, query and hash allowed)
 * - plain `changeset/123`
 * - `changeset #123`, `Changeset 123`, `Änderungssatz 123`
 *
 * Plain forms are only matched at a word start and never inside a path of another URL.
 */

type OsmChangesetRef = {
  id: number
  /** Index of the first character of the match in the text. */
  start: number
  /** Index after the last character of the match. */
  end: number
  /** The matched text, trailing punctuation excluded. */
  text: string
}

const ID = String.raw`(\d{1,12})(?!\w)`
// Not preceded by something that makes it part of another word, path, mention or address.
const START = String.raw`(?<![\w/.@#=-])`

const URL_FORM = String.raw`(?<url>${START}(?:https?:\/\/)?(?:www\.)?(?:openstreetmap|osm)\.org\/changeset\/${ID}(?:[/?#][^\s<>]*)?)`
const SLASH_FORM = String.raw`(?<slash>${START}changeset\/${ID})`
const WORD_FORM = String.raw`(?<word>${START}(?:changeset|änderungssatz)(?:\s+#?|#)${ID})`

const TRAILING_PUNCTUATION = /[.,;:!?)\]}'"]+$/

function changesetRefPattern() {
  // New instance per call: a global regex keeps `lastIndex` between uses.
  return new RegExp(`${URL_FORM}|${SLASH_FORM}|${WORD_FORM}`, 'giu')
}

/** All changeset references in `text`, in order of appearance. Ids are 1 to 12 digits. */
export function findOsmChangesetRefs(text: string) {
  const refs: OsmChangesetRef[] = []
  for (const match of text.matchAll(changesetRefPattern())) {
    // Each alternative has one id group; the first all-digit capture is the id.
    const digits = match.slice(1).find((part) => part != null && /^\d+$/.test(part))
    const id = digits ? Number(digits) : 0
    if (id < 1 || match.index == null) continue
    const raw = match[0]
    const matched = match.groups?.url ? raw.replace(TRAILING_PUNCTUATION, '') : raw
    refs.push({ id, start: match.index, end: match.index + matched.length, text: matched })
  }
  return refs
}
