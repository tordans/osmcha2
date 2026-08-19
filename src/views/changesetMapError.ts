export function changesetMapErrorCopy(error: unknown): { title: string; description: string } {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  const lower = message.toLowerCase()
  const looksLikeMiss =
    lower.includes('404') ||
    lower.includes('adiff') ||
    lower.includes('overpass') ||
    lower.includes('augmented diff')

  if (looksLikeMiss) {
    return {
      title: 'Map data is not ready yet',
      description:
        'OSMCha’s changeset visualization can lag a few minutes behind OpenStreetMap. Retry in a moment, or open an older changeset.',
    }
  }

  return {
    title: 'Could not load the changeset map',
    description: message || 'Try again. If this keeps happening, the map data service may be down.',
  }
}
