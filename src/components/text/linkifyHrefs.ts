/** Linkify mention plugin href is `/username` (no `@`). */
export function osmUserHrefFromMention(href: string) {
  const username = href.replace(/^\/+/, '')
  return `https://www.openstreetmap.org/user/${encodeURIComponent(username)}`
}

export function hashtagCommentSearch(hashtag: string) {
  return {
    filters: {
      comment: [{ label: hashtag, value: hashtag }],
    },
  }
}
