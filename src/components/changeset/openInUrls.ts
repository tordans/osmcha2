import type { MapParam } from '../../routing/mapParam.ts'
import type { RefParam } from '../../routing/refParam.ts'

/** MAID's overview page; each editor there opens the place it is given. Reads iD's hash form. */
export const MAID_URL = 'https://osm-editor-kit.github.io/maid/'

/** iD / Rapid use Leaflet (raster) zoom, one level above MapLibre. */
export function editorMapHash(map?: MapParam | null): string {
  if (!map) return ''
  const { lng, lat, zoom } = map
  const editorZoom = zoom + 1
  return `#map=${editorZoom}/${lat}/${lng}`
}

/**
 * `map` is where the user looks; `ref` the selected object. iD, Rapid and MAID select that object.
 * JOSM and Level0 load the whole changeset, which has no way to select one object.
 */
export function openInUrls(
  changesetId: number | string,
  map?: MapParam | null,
  ref?: RefParam | null,
) {
  const hash = editorMapHash(map)
  const idObject = ref ? `&${ref.type}=${ref.id}` : ''
  const rapidHash = ref ? `#id=${ref.type[0]}${ref.id}${hash.replace('#', '&')}` : hash
  return {
    osm: `https://www.openstreetmap.org/changeset/${changesetId}`,
    achavi: `https://overpass-api.de/achavi/?changeset=${changesetId}&relations=true`,
    id: `https://www.openstreetmap.org/edit?editor=id${idObject}${hash}`,
    josm: `http://127.0.0.1:8111/import?url=https://www.openstreetmap.org/api/0.6/changeset/${changesetId}/download`,
    level0: `http://level0.osmz.ru/?url=changeset/${changesetId}`,
    osmRevert: `https://revert.monicz.dev/?changesets=${changesetId}`,
    rapid: `https://rapideditor.org/edit${rapidHash}`,
    maid: `${MAID_URL}${rapidHash}`,
    // Spyglass is a MapLibre map, so it takes the viewport zoom as is.
    spyglass: `https://spyglass.jochentopf.com/${map ? `#p=${map.zoom}/${map.lat}/${map.lng}` : ''}`,
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
