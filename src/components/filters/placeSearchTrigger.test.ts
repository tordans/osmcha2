import { describe, expect, test } from 'vitest'
import { NOMINATIM_SEARCH_MIN_INTERVAL_MS } from '../../config/constants.ts'
import {
  endsWithWordSeparator,
  isSearchablePlaceQuery,
  millisecondsUntilPlaceSearchAllowed,
  shouldSearchPlaceOnEnter,
  shouldSearchPlaceOnInput,
} from './placeSearchTrigger.ts'

describe('shouldSearchPlaceOnInput', () => {
  test('searches once a word is finished', () => {
    expect(shouldSearchPlaceOnInput('Berlin ', '')).toBe(true)
    expect(shouldSearchPlaceOnInput('Berlin-', '')).toBe(true)
    expect(shouldSearchPlaceOnInput('Berlin,', '')).toBe(true)
    expect(shouldSearchPlaceOnInput('Berlin.', '')).toBe(true)
    expect(shouldSearchPlaceOnInput('Berlin/', '')).toBe(true)
  })

  test('does not search in the middle of a word', () => {
    expect(shouldSearchPlaceOnInput('Berl', '')).toBe(false)
    expect(shouldSearchPlaceOnInput('Berlin', '')).toBe(false)
  })

  test('does not search an unchanged query again', () => {
    expect(shouldSearchPlaceOnInput('Berlin ', 'Berlin')).toBe(false)
    expect(shouldSearchPlaceOnInput('Berlin Mitte ', 'Berlin')).toBe(true)
  })

  test('does not search empty or too short input', () => {
    expect(shouldSearchPlaceOnInput('   ', '')).toBe(false)
    expect(shouldSearchPlaceOnInput('a ', '')).toBe(false)
    expect(shouldSearchPlaceOnInput('京 ', '')).toBe(true)
  })
})

describe('shouldSearchPlaceOnEnter', () => {
  test('searches on Enter even in the middle of a word', () => {
    expect(shouldSearchPlaceOnEnter('Berl', '')).toBe(true)
    expect(shouldSearchPlaceOnEnter('Berlin', '')).toBe(true)
  })

  test('skips an unchanged or empty query', () => {
    expect(shouldSearchPlaceOnEnter('Berlin', 'Berlin')).toBe(false)
    expect(shouldSearchPlaceOnEnter('Berlin ', 'Berlin')).toBe(false)
    expect(shouldSearchPlaceOnEnter('  ', '')).toBe(false)
    expect(shouldSearchPlaceOnEnter('a', '')).toBe(false)
  })
})

describe('endsWithWordSeparator', () => {
  test('checks only the last character', () => {
    expect(endsWithWordSeparator('Berlin ')).toBe(true)
    expect(endsWithWordSeparator('Berlin x')).toBe(false)
    expect(endsWithWordSeparator('')).toBe(false)
  })
})

describe('isSearchablePlaceQuery', () => {
  test('needs two characters, or one CJK character', () => {
    expect(isSearchablePlaceQuery(' ab ')).toBe(true)
    expect(isSearchablePlaceQuery('a')).toBe(false)
    expect(isSearchablePlaceQuery('京')).toBe(true)
  })
})

describe('millisecondsUntilPlaceSearchAllowed', () => {
  test('sends at once when nothing was sent yet', () => {
    expect(millisecondsUntilPlaceSearchAllowed({ lastSentAt: null, now: 5000 })).toBe(0)
  })

  test('waits until one interval has passed since the last request', () => {
    expect(millisecondsUntilPlaceSearchAllowed({ lastSentAt: 5000, now: 5400 })).toBe(600)
    expect(millisecondsUntilPlaceSearchAllowed({ lastSentAt: 5000, now: 6000 })).toBe(0)
    expect(millisecondsUntilPlaceSearchAllowed({ lastSentAt: 5000, now: 9000 })).toBe(0)
  })

  test('uses one request per second by default', () => {
    expect(NOMINATIM_SEARCH_MIN_INTERVAL_MS).toBe(1000)
    expect(millisecondsUntilPlaceSearchAllowed({ lastSentAt: 0, now: 250 })).toBe(750)
  })
})
