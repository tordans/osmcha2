import { osmChangesetPayloadSchema } from '../../network/openstreetmap.ts'

/** OSM `/changeset/{id}.json` marks an in-progress edit with `open: true` (no `closed_at`). */
export function isOsmChangesetOpen(metadata: unknown): boolean {
  const parsed = osmChangesetPayloadSchema.safeParse(metadata)
  if (!parsed.success) return false
  return parsed.data.changeset.open === true
}
