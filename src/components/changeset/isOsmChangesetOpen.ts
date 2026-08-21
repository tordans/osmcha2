type OsmChangesetPayload = {
  changeset?: {
    open?: boolean
    closed_at?: string
  }
}

/** OSM `/changeset/{id}.json` marks an in-progress edit with `open: true` (no `closed_at`). */
export function isOsmChangesetOpen(metadata: unknown): boolean {
  const changeset = (metadata as OsmChangesetPayload | null | undefined)?.changeset
  if (!changeset) return false
  return changeset.open === true
}
