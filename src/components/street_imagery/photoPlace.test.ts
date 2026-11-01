import { describe, expect, test } from 'vitest'
import { photoPlaceOf } from './photoPlace.ts'

describe('photoPlaceOf', () => {
  const shape = { refs: [1, 2], closed: false, first: { lon: 13.4, lat: 52.5 } }

  test('a point is its own place', () => {
    expect(photoPlaceOf({ type: 'node', lon: 13.4, lat: 52.5 })).toEqual([13.4, 52.5])
  })

  test('a point without coordinates has none', () => {
    expect(photoPlaceOf({ type: 'node' })).toBeNull()
  })

  test('a line starts at its first node', () => {
    expect(photoPlaceOf({ type: 'way', wayShape: shape })).toEqual([13.4, 52.5])
  })

  test('areas and relations have none', () => {
    expect(photoPlaceOf({ type: 'way', wayShape: { ...shape, closed: true } })).toBeNull()
    expect(photoPlaceOf({ type: 'relation' })).toBeNull()
  })
})
