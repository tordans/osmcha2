const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
export const PERSIST_MAX_AGE_MS = 7 * 24 * HOUR

/** Never auto-refetch. Mutations must `invalidateQueries`. */
export const cacheForever = {
  staleTime: Infinity,
  gcTime: PERSIST_MAX_AGE_MS,
} as const

/**
 * Static adiff XML from adiffs.osmcha.org (Cloudflare). The file does not change
 * once generated. Keep for the whole tab session; do not persist (parsed trees are large).
 */
export const cacheChangesetMap = {
  staleTime: Infinity,
  gcTime: Infinity,
} as const

/** OSM discussion for the changeset currently on screen. */
export const DISCUSSION_STALE_MS = 5 * MINUTE

export const cacheDiscussion = {
  staleTime: DISCUSSION_STALE_MS,
  gcTime: PERSIST_MAX_AGE_MS,
} as const

/** Review queue: never auto-refetch; the list refresh button turns orange after this. */
export const LIST_REFRESH_HINT_MS = 5 * MINUTE

export const cacheChangesetList = {
  staleTime: Infinity,
  gcTime: PERSIST_MAX_AGE_MS,
} as const

/**
 * Saved filters (AOIs): cheap list/detail GETs. Show persisted data, then refetch
 * on mount and when the window/tab is focused so another tab's edits show up.
 */
export const cacheSavedFilters = {
  staleTime: 0,
  gcTime: PERSIST_MAX_AGE_MS,
  refetchOnWindowFocus: true,
} as const

/** Operational status — refresh without being chatty. */
export const cacheFiveMinutes = {
  staleTime: 5 * MINUTE,
  gcTime: PERSIST_MAX_AGE_MS,
} as const

/** Reference data that rarely changes (filter vocabularies, geocode hits). */
export const cacheOneHour = {
  staleTime: HOUR,
  gcTime: PERSIST_MAX_AGE_MS,
} as const
