import { postOsmChangesetComment } from './osmAuthClient.ts'
import { canUseOsmAuthFromThisBuild } from './osmAuthConfig.ts'

export type SubmitDiscussionResult =
  | { ok: true }
  | { ok: false; reason: 'not-configured' | 'error'; message?: string }

/** Post a changeset discussion comment via the user’s OpenStreetMap OAuth session. */
export async function submitDiscussionPost(options: {
  changesetId: number
  text: string
}): Promise<SubmitDiscussionResult> {
  if (!canUseOsmAuthFromThisBuild()) {
    return { ok: false, reason: 'not-configured' }
  }

  try {
    await postOsmChangesetComment(options.changesetId, options.text)
    return { ok: true }
  } catch (error: unknown) {
    return {
      ok: false,
      reason: 'error',
      message: error instanceof Error ? error.message : undefined,
    }
  }
}
