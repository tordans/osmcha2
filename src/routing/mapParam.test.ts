import { describe, expect, test } from 'vitest'
import {
  parseMapParam,
  roundPositionForURL,
  searchWithoutMap,
  serializeMapParam,
} from './mapParam.ts'
import { routerSearch } from './routerSearch.ts'

describe('mapParam', () => {
  test('round-trips zoom/lat/lng', () => {
    const input = { zoom: 12.4, lat: 52.49894, lng: 13.43294 }
    const serialized = serializeMapParam(input)
    expect(serialized).toBe('12.4/52.499/13.433')
    expect(parseMapParam(serialized)).toEqual({
      zoom: 12.4,
      lat: 52.499,
      lng: 13.433,
    })
  })

  test('keeps slashes readable in serialized map values', () => {
    const serialized = serializeMapParam({ zoom: 12.4, lat: 52.49894, lng: 13.43294 })
    const stringified = routerSearch.stringify({ map: serialized })
    expect(stringified).toContain('map=')
    expect(stringified).toContain('12.4/52.499/13.433')
    expect(stringified).not.toContain('%2F')
  })

  test('rejects legacy @lat,lng,z shapes', () => {
    expect(parseMapParam('@52.8,13.6,12.5z')).toBeNull()
    expect(parseMapParam('')).toBeNull()
    expect(parseMapParam('not-a-map')).toBeNull()
  })

  test('rounds lat/lng precision by zoom on serialize', () => {
    expect(roundPositionForURL(52.123456789, 13.987654321, 10)).toEqual([52.123, 13.988, 10])
    expect(roundPositionForURL(52.123456789, 13.987654321, 14)).toEqual([52.1235, 13.9877, 14])
    expect(roundPositionForURL(52.123456789, 13.987654321, 18)).toEqual([52.12346, 13.98765, 18])
    expect(serializeMapParam({ zoom: 18, lat: 52.123456789, lng: 13.987654321 })).toBe(
      '18/52.12346/13.98765',
    )
  })

  test('omits map when opening a different changeset', () => {
    expect(searchWithoutMap({ users: 'a', page: 2, map: '12/52.5/13.4' })).toEqual({
      users: 'a',
      page: 2,
    })
  })
})
