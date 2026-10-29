import { describe, expect, it } from 'vitest'
import {
  streetImageryIdsOfValue,
  streetImageryPhotosOfRow,
  streetImageryProviderOfKey,
  streetImageryRefsOfTag,
} from './streetImageryTags.ts'

const UUID = '3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f'

describe('streetImageryProviderOfKey', () => {
  it.each([
    ['mapillary', 'mapillary'],
    ['mapillary:1', 'mapillary'],
    ['mapillary:2', 'mapillary'],
    ['image:mapillary', 'mapillary'],
    ['cycleway:right:mapillary', 'mapillary'],
    ['source:traffic_sign:forward:mapillary', 'mapillary'],
    ['panoramax', 'panoramax'],
    ['panoramax:1', 'panoramax'],
    ['image:panoramax', 'panoramax'],
  ])('%s holds %s photos', (key, provider) => {
    expect(streetImageryProviderOfKey(key)).toBe(provider)
  })

  it.each([
    'name',
    'image',
    'mapillaryx',
    'xmapillary',
    'panoramax_id',
    'mapillary:map_feature',
    '',
  ])('%s holds no photos', (key) => {
    expect(streetImageryProviderOfKey(key)).toBeUndefined()
  })
})

describe('streetImageryIdsOfValue', () => {
  it('reads one Mapillary id', () => {
    expect(streetImageryIdsOfValue('mapillary', '444210030563481')).toEqual(['444210030563481'])
  })

  it('splits on semicolons, trims and keeps each id once', () => {
    expect(
      streetImageryIdsOfValue('mapillary', ' 444210030563481 ;; 123456789012345;444210030563481 '),
    ).toEqual(['444210030563481', '123456789012345'])
  })

  it('leaves out parts that are no id', () => {
    expect(streetImageryIdsOfValue('mapillary', 'yes;12;abc;444210030563481')).toEqual([
      '444210030563481',
    ])
    expect(streetImageryIdsOfValue('mapillary', '')).toEqual([])
  })

  it('reads ids out of Mapillary links', () => {
    expect(
      streetImageryIdsOfValue(
        'mapillary',
        'https://www.mapillary.com/app/?pKey=444210030563481&focus=photo',
      ),
    ).toEqual(['444210030563481'])
    expect(
      streetImageryIdsOfValue('mapillary', 'https://mapillary.com/map/im/444210030563481'),
    ).toEqual(['444210030563481'])
    expect(
      streetImageryIdsOfValue('mapillary', 'https://example.org/app/?pKey=444210030563481'),
    ).toEqual([])
  })

  it('reads Panoramax uuids, in lower case', () => {
    expect(streetImageryIdsOfValue('panoramax', UUID.toUpperCase())).toEqual([UUID])
    expect(streetImageryIdsOfValue('panoramax', `${UUID};${UUID}`)).toEqual([UUID])
    expect(streetImageryIdsOfValue('panoramax', '12345')).toEqual([])
  })

  it('reads ids out of Panoramax links of any server', () => {
    expect(
      streetImageryIdsOfValue('panoramax', `https://api.panoramax.xyz/#pic=${UUID}&focus=pic`),
    ).toEqual([UUID])
    expect(
      streetImageryIdsOfValue('panoramax', `https://panoramax.example.org/?pic=${UUID}`),
    ).toEqual([UUID])
    expect(
      streetImageryIdsOfValue(
        'panoramax',
        `https://panoramax.example.org/api/pictures/${UUID}/sd.jpg`,
      ),
    ).toEqual([UUID])
    expect(
      streetImageryIdsOfValue(
        'panoramax',
        `https://panoramax.example.org/api/collections/abc/items/${UUID}`,
      ),
    ).toEqual([UUID])
  })

  it('ignores text that is not a link', () => {
    expect(streetImageryIdsOfValue('panoramax', 'https://')).toEqual([])
  })
})

describe('streetImageryRefsOfTag', () => {
  it('pairs the provider of the key with the ids of the value', () => {
    expect(streetImageryRefsOfTag('mapillary:1', '444210030563481;123456789012345')).toEqual([
      { provider: 'mapillary', id: '444210030563481' },
      { provider: 'mapillary', id: '123456789012345' },
    ])
    expect(streetImageryRefsOfTag('panoramax:1', UUID)).toEqual([
      { provider: 'panoramax', id: UUID },
    ])
  })

  it('is empty for other keys', () => {
    expect(streetImageryRefsOfTag('name', '444210030563481')).toEqual([])
  })
})

describe('streetImageryPhotosOfRow', () => {
  const OLD = '111111111111111'
  const NEW = '222222222222222'

  it('shows the photos of an added or unchanged value', () => {
    expect(streetImageryPhotosOfRow({ kind: 'added', key: 'mapillary', value: NEW })).toEqual([
      { provider: 'mapillary', id: NEW, old: false },
    ])
    expect(
      streetImageryPhotosOfRow({ kind: 'unchanged', key: 'mapillary', value: 'x', rawValue: NEW }),
    ).toEqual([{ provider: 'mapillary', id: NEW, old: false }])
  })

  it('marks the photos of a removed row as old', () => {
    expect(streetImageryPhotosOfRow({ kind: 'removed', key: 'mapillary', value: OLD })).toEqual([
      { provider: 'mapillary', id: OLD, old: true },
    ])
  })

  it('shows the new photos of a changed row, then the old ones the change dropped', () => {
    expect(
      streetImageryPhotosOfRow({
        kind: 'changed',
        key: 'mapillary',
        oldValue: `${OLD};${NEW}`,
        newValue: NEW,
      }),
    ).toEqual([
      { provider: 'mapillary', id: NEW, old: false },
      { provider: 'mapillary', id: OLD, old: true },
    ])
  })

  it('reads the raw text before the displayed value', () => {
    expect(
      streetImageryPhotosOfRow({
        kind: 'changed',
        key: 'mapillary',
        oldValue: null,
        newValue: null,
        rawOld: OLD,
        rawNew: NEW,
      }),
    ).toEqual([
      { provider: 'mapillary', id: NEW, old: false },
      { provider: 'mapillary', id: OLD, old: true },
    ])
  })

  it('names no photo for other keys or values that are no text', () => {
    expect(streetImageryPhotosOfRow({ kind: 'added', key: 'name', value: NEW })).toEqual([])
    expect(streetImageryPhotosOfRow({ kind: 'added', key: 'mapillary', value: { a: 1 } })).toEqual(
      [],
    )
  })
})
