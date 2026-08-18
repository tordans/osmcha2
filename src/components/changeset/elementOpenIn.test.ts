import { describe, expect, test } from 'vitest'
import { elementOpenInUrls, idToMinimalForm } from './elementOpenIn.ts'

describe('elementOpenInUrls', () => {
  test('builds OSM, iD, JOSM, Level0, and RapiD from type/id', () => {
    const urls = elementOpenInUrls('way/42')
    expect(urls.osm).toBe('https://www.openstreetmap.org/way/42')
    expect(urls.id).toBe('https://www.openstreetmap.org/edit?editor=id&way=42')
    expect(urls.josm).toBe('http://127.0.0.1:8111/load_object?new_layer=true&objects=w42')
    expect(urls.level0).toBe('http://level0.osmz.ru/?url=way/42')
    expect(urls.rapid).toBe('https://rapideditor.org/edit#id=w42')
    expect(urls.mapillary).toBeUndefined()
  })

  test('adds Mapillary and Panoramax when coordinates exist', () => {
    const urls = elementOpenInUrls('node/9', 52.5, 13.4)
    expect(urls.mapillary).toBe('https://www.mapillary.com/app/?lat=52.5&lng=13.4&z=16')
    expect(urls.panoramax).toBe('https://api.panoramax.xyz/?focus=map&map=16/52.5/13.4')
  })

  test('shortens slashed ids for JOSM and RapiD', () => {
    expect(idToMinimalForm('relation/99')).toBe('r99')
  })
})
