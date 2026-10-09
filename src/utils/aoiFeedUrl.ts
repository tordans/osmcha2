import { API_URL, RSS_REWRITE_URL } from '../config/constants.ts'

/** RSS feed of a saved filter, rewritten so entries open in OSMCha2. */
export function aoiFeedUrl(aoiId: string | number) {
  const sourceFeed = `${API_URL}/aoi/${aoiId}/changesets/feed/`
  return `${RSS_REWRITE_URL}?url=${encodeURIComponent(sourceFeed)}`
}
