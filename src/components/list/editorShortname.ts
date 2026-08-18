/** Map OSM `created_by` / editor strings to a short label for list scanning. */
export function editorShortname(longname: string | null | undefined): string {
  if (!longname) return 'Unknown'

  const lower = longname.toLowerCase()

  if (lower.includes('streetcomplete')) return 'StreetComplete'
  if (lower.includes('josm')) return 'JOSM'
  if (lower.includes('every door')) return 'Every Door'
  if (lower.includes('vespucci')) return 'Vespucci'
  if (lower.includes('osmand')) return 'OsmAnd'
  if (lower.includes('rapid')) return 'Rapid'
  if (lower.includes('go map')) return 'GoMap'
  if (lower.includes('id')) return 'iD'

  return longname.split(' ')[0] ?? longname
}
