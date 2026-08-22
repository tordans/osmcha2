import { describe, expect, test } from 'vitest'
import { NOTE_PUBLIC_ORIGIN } from '../../config/constants.ts'
import type { AdiffAction } from './changesetElements.ts'
import {
  actionMatchingRef,
  changesetObjectUrl,
  refDeepLinkKey,
  refParamFromElement,
  refsEqual,
  searchWithRef,
  searchWithRefAndPin,
  tagGroupContainsRef,
} from './refSelection.ts'

const actions: AdiffAction[] = [
  { type: 'create', new: { type: 'node', id: 10 } },
  { type: 'delete', old: { type: 'way', id: 123 } },
  { type: 'modify', old: { type: 'relation', id: 9 }, new: { type: 'relation', id: 9 } },
]

describe('actionMatchingRef', () => {
  test('matches type and id on new ?? old', () => {
    expect(actionMatchingRef(actions, { type: 'node', id: 10 })).toEqual(actions[0])
    expect(actionMatchingRef(actions, { type: 'way', id: 123, key: 'highway' })).toEqual(actions[1])
    expect(actionMatchingRef(actions, { type: 'relation', id: 9 })).toEqual(actions[2])
  })

  test('returns null when ref is missing or nothing matches', () => {
    expect(actionMatchingRef(actions, null)).toBeNull()
    expect(actionMatchingRef(actions, { type: 'way', id: 999 })).toBeNull()
    expect(actionMatchingRef([], { type: 'node', id: 10 })).toBeNull()
  })
})

describe('searchWithRef', () => {
  test('sets ref and leaves pin and other keys alone', () => {
    const search = { page: 1, pin: '52.52,13.40', map: '12/1/2' }
    expect(searchWithRef(search, { type: 'way', id: 123 })).toEqual({
      page: 1,
      pin: '52.52,13.40',
      map: '12/1/2',
      ref: 'way/123',
    })
    expect(searchWithRef(search, { type: 'way', id: 123, key: 'highway' })).toEqual({
      page: 1,
      pin: '52.52,13.40',
      map: '12/1/2',
      ref: 'way/123/highway',
    })
  })

  test('omits ref when cleared and does not drop pin', () => {
    expect(searchWithRef({ page: 1, ref: 'way/1', pin: '52.52,13.40' }, null)).toEqual({
      page: 1,
      pin: '52.52,13.40',
    })
  })
})

describe('searchWithRefAndPin', () => {
  test('sets ref and pin together', () => {
    expect(
      searchWithRefAndPin(
        { page: 1, map: '12/1/2' },
        { type: 'way', id: 123, key: 'highway' },
        {
          lat: 52.52,
          lng: 13.4,
        },
      ),
    ).toEqual({
      page: 1,
      map: '12/1/2',
      ref: 'way/123/highway',
      pin: '52.52000,13.40000',
    })
  })

  test('writes pin without inventing a ref and clears an existing ref', () => {
    expect(
      searchWithRefAndPin({ page: 1, ref: 'way/1', pin: '1.00,2.00' }, null, {
        lat: 52.52014,
        lng: 13.40521,
      }),
    ).toEqual({
      page: 1,
      pin: '52.52014,13.40521',
    })
  })

  test('leaves pin untouched when pin is omitted', () => {
    expect(searchWithRefAndPin({ page: 1, pin: '52.52,13.40' }, { type: 'way', id: 123 })).toEqual({
      page: 1,
      pin: '52.52,13.40',
      ref: 'way/123',
    })
  })

  test('clears pin when pin is null so a note without a pin does not keep the last one', () => {
    expect(
      searchWithRefAndPin(
        { page: 1, ref: 'way/1', pin: '52.52,13.40' },
        { type: 'way', id: 123 },
        null,
      ),
    ).toEqual({
      page: 1,
      ref: 'way/123',
    })
  })
})

describe('refParamFromElement', () => {
  test('accepts OSM types with a positive integer id', () => {
    expect(refParamFromElement('way', 123)).toEqual({ type: 'way', id: 123 })
    expect(refParamFromElement('node', 1, 'highway')).toEqual({
      type: 'node',
      id: 1,
      key: 'highway',
    })
  })

  test('rejects aliases, missing ids, and non-positive ids', () => {
    expect(refParamFromElement('n', 123)).toBeNull()
    expect(refParamFromElement('way', undefined)).toBeNull()
    expect(refParamFromElement('way', 0)).toBeNull()
    expect(refParamFromElement('way', 1.5)).toBeNull()
  })
})

describe('refDeepLinkKey', () => {
  test('joins changeset id, serialized ref, and pin', () => {
    expect(refDeepLinkKey(999, { type: 'way', id: 123, key: 'highway' }, '52.52,13.40')).toBe(
      '999:way/123/highway:52.52,13.40',
    )
    expect(refDeepLinkKey(999, { type: 'way', id: 123 })).toBe('999:way/123:')
    expect(refDeepLinkKey(999, null, '52.52,13.40')).toBe('999::52.52,13.40')
    expect(refDeepLinkKey(999, null)).toBeNull()
  })
})

describe('refsEqual', () => {
  test('treats missing refs as equal and compares type, id, and key', () => {
    expect(refsEqual(null, undefined)).toBe(true)
    expect(refsEqual({ type: 'way', id: 1 }, { type: 'way', id: 1 })).toBe(true)
    expect(refsEqual({ type: 'way', id: 1, key: 'highway' }, { type: 'way', id: 1 })).toBe(false)
    expect(refsEqual({ type: 'way', id: 1 }, { type: 'node', id: 1 })).toBe(false)
  })
})

describe('tagGroupContainsRef', () => {
  const group = [
    { type: 'way', id: 1 },
    { type: 'way', id: 2 },
  ]

  test('matches type and id, ignoring a tag key', () => {
    expect(tagGroupContainsRef(group, { type: 'way', id: 2, key: 'highway' })).toBe(true)
    expect(tagGroupContainsRef(group, { type: 'way', id: 9 })).toBe(false)
    expect(tagGroupContainsRef(group, null)).toBe(false)
  })
})

describe('changesetObjectUrl', () => {
  test('copies an object ref without a tag key or pin', () => {
    expect(changesetObjectUrl(999, { type: 'way', id: 123, key: 'highway' })).toBe(
      `${NOTE_PUBLIC_ORIGIN}/changesets/999?ref=way/123`,
    )
  })
})
