import { describe, expect, test } from 'vitest'
import { aoiListFromQueryData } from './aoi.ts'

const feature = { id: 'abc', properties: { name: 'Berlin' } }

describe('aoiListFromQueryData', () => {
  test('returns an already-normalized feature array', () => {
    expect(aoiListFromQueryData([feature])).toEqual([feature])
  })

  test('unwraps a GeoJSON FeatureCollection (legacy persist / osmcha-frontend)', () => {
    expect(
      aoiListFromQueryData({
        type: 'FeatureCollection',
        features: [feature],
      }),
    ).toEqual([feature])
  })

  test('unwraps the paginated API payload', () => {
    expect(
      aoiListFromQueryData({
        count: 1,
        next: null,
        previous: null,
        results: { type: 'FeatureCollection', features: [feature] },
      }),
    ).toEqual([feature])
  })

  test('returns an empty list for missing or unknown shapes', () => {
    expect(aoiListFromQueryData(undefined)).toEqual([])
    expect(aoiListFromQueryData(null)).toEqual([])
    expect(aoiListFromQueryData({ count: 0 })).toEqual([])
  })
})
