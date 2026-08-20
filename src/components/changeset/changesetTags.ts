const HIDDEN_KEYS = new Set(['comment', 'created_by', 'host'])

/** Keys already shown on the review header (comment, editor, host tooltip). */
export function isVisibleChangesetTagKey(key: string) {
  if (HIDDEN_KEYS.has(key)) return false
  if (key.startsWith('ideditor')) return false
  if (key.startsWith('warnings:')) return false
  if (key.startsWith('resolved')) return false
  return true
}

export function changesetTagsForDisplay(metadata: Record<string, string | number> | undefined) {
  return Object.entries(metadata ?? {}).filter(([key]) => isVisibleChangesetTagKey(key))
}
