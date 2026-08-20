const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

/** Never auto-refetch. Mutations must `invalidateQueries`. */
export const cacheForever = {
  staleTime: Infinity,
  gcTime: Infinity,
} as const

/**
 * Changeset adiffs are large parsed trees. Never refetch while cached; drop after
 * an hour unused so reviewing many changesets does not pin them all in memory.
 */
export const cacheChangesetMap = {
  staleTime: Infinity,
  gcTime: HOUR,
} as const

/** OSM discussion for the changeset currently on screen. */
export const DISCUSSION_STALE_MS = 5 * MINUTE

export const cacheDiscussion = {
  staleTime: DISCUSSION_STALE_MS,
  gcTime: Infinity,
} as const

/** Review queue and operational status — refresh without being chatty. */
export const cacheFiveMinutes = {
  staleTime: 5 * MINUTE,
  gcTime: 30 * MINUTE,
} as const

/** Reference data that rarely changes (filter vocabularies, geocode hits). */
export const cacheOneHour = {
  staleTime: HOUR,
  gcTime: Infinity,
} as const
