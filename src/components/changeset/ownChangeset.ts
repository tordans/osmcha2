/** Why the review buttons are off on the signed-in user's own changesets; the API refuses them. */
export const OWN_CHANGESET_REVIEW_MESSAGE = 'You can’t review your own changesets.'

type Who = { username?: string | null; uid?: number | string | null }

/**
 * Whether the signed-in user made this changeset. By uid when both have one, as names change;
 * else by name.
 */
export function isOwnChangeset(signedIn: Who | null | undefined, author: Who) {
  if (!signedIn) return false
  if (signedIn.uid != null && author.uid != null && author.uid !== '') {
    return String(signedIn.uid) === String(author.uid)
  }
  return Boolean(signedIn.username) && signedIn.username === author.username
}
