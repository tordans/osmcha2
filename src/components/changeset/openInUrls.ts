export type ReviewCamera = {
  center: {
    lng: number
    lat: number
  }
  zoom: number
}

/** iD / Rapid use Leaflet (raster) zoom, one level above MapLibre. */
export function editorMapHash(camera?: ReviewCamera | null): string {
  if (!camera) return ''
  const { lng, lat } = camera.center
  const zoom = camera.zoom + 1
  return `#map=${zoom}/${lat}/${lng}`
}

export function openInUrls(changesetId: number | string, camera?: ReviewCamera | null) {
  const hash = editorMapHash(camera)
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

export function openExternal(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}
