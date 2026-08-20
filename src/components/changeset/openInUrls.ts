import type { MapParam } from '../../routing/mapParam.ts'

/** iD / Rapid use Leaflet (raster) zoom, one level above MapLibre. */
export function editorMapHash(map?: MapParam | null): string {
  if (!map) return ''
  const { lng, lat, zoom } = map
  const editorZoom = zoom + 1
  return `#map=${editorZoom}/${lat}/${lng}`
}

export function openInUrls(changesetId: number | string, map?: MapParam | null) {
  const hash = editorMapHash(map)
  return {
    osm: `https://www.openstreetmap.org/changeset/${changesetId}`,
    achavi: `https://overpass-api.de/achavi/?changeset=${changesetId}&relations=true`,
    id: `https://www.openstreetmap.org/edit?editor=id${hash}`,
    josm: `http://127.0.0.1:8111/import?url=https://www.openstreetmap.org/api/0.6/changeset/${changesetId}/download`,
    level0: `http://level0.osmz.ru/?url=changeset/${changesetId}`,
    osmRevert: `https://revert.monicz.dev/?changesets=${changesetId}`,
    rapid: `https://rapideditor.org/edit${hash}`,
    resultMaps: `https://resultmaps.neis-one.org/osm-change-viz?c=${changesetId}`,
  } as const
}

export function hdycUrl(username: string): string {
  return `https://hdyc.neis-one.org/?${username}`
}

export function missingMapsUrl(username: string): string {
  return `https://www.missingmaps.org/users/#/${encodeURIComponent(username)}`
}

export function openExternal(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}
