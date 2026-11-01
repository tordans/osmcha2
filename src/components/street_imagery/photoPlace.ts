import type { ElementChange } from '../changeset/changesetElements.ts'

/**
 * The place whose photos a change can look for: a point itself, the start of a line. Areas and
 * relations have no one place that photos look at.
 */
export function photoPlaceOf(
  change: Pick<ElementChange, 'type' | 'lon' | 'lat' | 'wayShape'>,
): [lng: number, lat: number] | null {
  if (change.type === 'node') {
    return change.lon != null && change.lat != null ? [change.lon, change.lat] : null
  }
  if (change.type !== 'way' || change.wayShape?.closed !== false) return null
  const { first } = change.wayShape
  return first ? [first.lon, first.lat] : null
}
