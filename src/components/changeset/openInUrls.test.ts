import { describe, expect, test } from 'vitest'
import { editorMapHash, hdycUrl, openInUrls } from './openInUrls.ts'

describe('openInUrls', () => {
  test('builds Achavi, JOSM, Level0, osm-revert, and ResultMaps from the changeset id', () => {
    const urls = openInUrls(123)
    expect(urls.achavi).toBe('https://overpass-api.de/achavi/?changeset=123&relations=true')
    expect(urls.josm).toBe(
      'http://127.0.0.1:8111/import?url=https://www.openstreetmap.org/api/0.6/changeset/123/download',
    )
    expect(urls.level0).toBe('http://level0.osmz.ru/?url=changeset/123')
    expect(urls.osmRevert).toBe('https://revert.monicz.dev/?changesets=123')
    expect(urls.resultMaps).toBe('https://resultmaps.neis-one.org/osm-change-viz?c=123')
    expect(urls.osm).toBe('https://www.openstreetmap.org/changeset/123')
  })

  test('appends the MapLibre viewport as an iD/Rapid hash with raster zoom', () => {
    const urls = openInUrls(9, { lng: 13.4, lat: 52.5, zoom: 14 })
    expect(urls.id).toBe('https://www.openstreetmap.org/edit?editor=id#map=15/52.5/13.4')
    expect(urls.rapid).toBe('https://rapideditor.org/edit#map=15/52.5/13.4')
  })

  test('omits the editor hash when the camera is missing', () => {
    expect(editorMapHash(undefined)).toBe('')
    expect(openInUrls(1).id).toBe('https://www.openstreetmap.org/edit?editor=id')
  })

  test('builds HDYC from the OSM username', () => {
    expect(hdycUrl('alice')).toBe('https://hdyc.neis-one.org/?alice')
  })
})
