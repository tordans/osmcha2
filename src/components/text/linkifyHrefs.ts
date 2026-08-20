import { listSearchFromFilters } from '../../routing/filterSearch.ts'

/** Linkify mention plugin href is `/username` (no `@`). */
export function osmUserHrefFromMention(href: string) {
  const username = href.replace(/^\/+/, '')
  return `https://www.openstreetmap.org/user/${encodeURIComponent(username)}`
}

export function hashtagCommentSearch(hashtag: string) {
  return listSearchFromFilters({
    comment: [{ label: hashtag, value: hashtag }],
  })
}
