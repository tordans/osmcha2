import { NOMINATIM_SEARCH_MIN_INTERVAL_MS } from '../../config/constants.ts'

/** Characters that end a word. Typing one after a word starts a place search. */
const WORD_SEPARATOR = /[\s\-,./;:|_]/

/** Scripts where a single character can name a place, e.g. 京 (Kyoto). */
function isOneCharInputAllowed(input: string) {
  try {
    return /\p{scx=Han}|\p{scx=Hangul}|\p{scx=Hiragana}|\p{scx=Katakana}/u.test(input)
  } catch {
    return true
  }
}

/** Whether the text (trimmed) is long enough to search for a place. */
export function isSearchablePlaceQuery(text: string) {
  const query = text.trim()
  return query.length >= 2 || (query.length === 1 && isOneCharInputAllowed(query))
}

/** Whether the last character typed is a word separator, i.e. the user just finished a word. */
export function endsWithWordSeparator(text: string) {
  const last = text.slice(-1)
  return last !== '' && WORD_SEPARATOR.test(last)
}

function isNewPlaceQuery(text: string, lastSentQuery: string) {
  const query = text.trim()
  return isSearchablePlaceQuery(query) && query !== lastSentQuery.trim()
}

/** While typing: search only after a finished word, and only if the text changed. */
export function shouldSearchPlaceOnInput(input: string, lastSentQuery: string) {
  return endsWithWordSeparator(input) && isNewPlaceQuery(input, lastSentQuery)
}

/** Enter always searches, as long as the text changed since the last query. */
export function shouldSearchPlaceOnEnter(input: string, lastSentQuery: string) {
  return isNewPlaceQuery(input, lastSentQuery)
}

/** Milliseconds until the next place search may be sent. 0 means send now. */
export function millisecondsUntilPlaceSearchAllowed({
  lastSentAt,
  now,
  intervalMs = NOMINATIM_SEARCH_MIN_INTERVAL_MS,
}: {
  lastSentAt: number | null
  now: number
  intervalMs?: number
}) {
  if (lastSentAt === null) return 0
  return Math.max(0, lastSentAt + intervalMs - now)
}
