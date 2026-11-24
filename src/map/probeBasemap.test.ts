import { describe, expect, it } from 'vitest'
import { probeTile, tileUrl } from './probeBasemap.ts'

describe('tileUrl', () => {
  it('fills xyz, tms and quadkey templates', () => {
    expect(tileUrl('https://t/{z}/{x}/{y}.jpg', 141, 89, 8)).toBe('https://t/8/141/89.jpg')
    expect(tileUrl('https://t/{zoom}/{x}/{-y}.jpg', 141, 89, 8)).toBe('https://t/8/141/166.jpg')
    expect(tileUrl('https://t/{z}/{x}/{y}.png', 1, 0, 1, 'tms')).toBe('https://t/1/1/1.png')
    expect(tileUrl('https://t/a{quadkey}.jpeg', 3, 5, 3)).toBe('https://t/a213.jpeg')
    expect(tileUrl('https://{switch:a,b}.t/{z}', 0, 0, 0)).toBe('https://a.t/0')
  })

  it('fills the WMS bbox of the tile', () => {
    const url = tileUrl('https://w?BBOX={bbox-epsg-3857}', 0, 0, 0)
    const bbox = url.split('=')[1]!.split(',').map(Number)
    expect(bbox[0]).toBeCloseTo(-20037508.34, 1)
    expect(bbox[3]).toBeCloseTo(20037508.34, 1)
  })
})

describe('probeTile', () => {
  it('takes the tile in the middle of the bounds, within the source zooms', () => {
    // Bratislava, a few hundred metres wide.
    const bounds: [number, number, number, number] = [17.1, 48.14, 17.11, 48.15]
    expect(probeTile(bounds, {})).toEqual({ x: 35881, y: 22741, z: 16 })
    expect(probeTile(bounds, { maxzoom: 8 })).toEqual({ x: 140, y: 88, z: 8 })
    expect(probeTile([0, 0, 180, 10], { minzoom: 3 }).z).toBe(3)
  })
})
