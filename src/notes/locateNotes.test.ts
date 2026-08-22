import { describe, expect, test } from 'vitest'
import { locateNotes, objectRefKey, type LocatedNotes, type PublishedNote } from './locateNotes.ts'

const ORIGIN = 'https://osmcha.org'
const CHANGESET_ID = 999
const pin = { lat: 52.52014, lng: 13.40521 }

function see(query: string, body: string) {
  return `See ${ORIGIN}/changesets/${CHANGESET_ID}?${query}\n${body}`
}

function listed(ids: Array<[string, number]>, keys: Array<[string, string[]]> = []) {
  return {
    changesetId: CHANGESET_ID,
    listedObjects: new Set(ids.map(([type, id]) => objectRefKey(type, id))),
    keysByObject: new Map(keys.map(([objectKey, tagKeys]) => [objectKey, new Set(tagKeys)])),
  }
}

function snapshot(located: LocatedNotes) {
  return {
    changesetNotes: located.changesetNotes,
    byObject: Object.fromEntries(
      [...located.byObject].map(([key, value]) => [
        key,
        { object: value.object, byKey: Object.fromEntries(value.byKey) },
      ]),
    ),
    unmatched: located.unmatched,
  }
}

function meta(
  overrides: Partial<PublishedNote> = {},
): Pick<PublishedNote, 'author'> & Partial<Pick<PublishedNote, 'date' | 'postId'>> {
  return { author: 'alice', date: '2026-08-01T12:00:00Z', postId: 1, ...overrides }
}

describe('objectRefKey', () => {
  test('joins type and id', () => {
    expect(objectRefKey('way', 123)).toBe('way/123')
    expect(objectRefKey('node', 1)).toBe('node/1')
  })
})

describe('locateNotes', () => {
  test('places intro plus groups: intro and pin-only on the changeset, listed object and tag attached', () => {
    const text = `Thanks for the mapping.

${see('ref=way/123', 'Object note.')}

${see('ref=way/123/highway', 'Tag note.')}

${see('pin=52.52014,13.40521', 'Pin only.')}
`
    const located = locateNotes(
      [{ id: 1, user: 'alice', date: '2026-08-01T12:00:00Z', text }],
      listed([['way', 123]], [['way/123', ['highway', 'name']]]),
    )

    expect(snapshot(located)).toEqual({
      changesetNotes: [
        { ...meta(), body: 'Thanks for the mapping.' },
        { ...meta(), pin, body: 'Pin only.' },
      ],
      byObject: {
        'way/123': {
          object: [{ ...meta(), ref: { type: 'way', id: 123 }, body: 'Object note.' }],
          byKey: {
            highway: [
              { ...meta(), ref: { type: 'way', id: 123, key: 'highway' }, body: 'Tag note.' },
            ],
          },
        },
      },
      unmatched: [],
    })
  })

  test('places a pin-only note with no intro on the changeset', () => {
    const located = locateNotes(
      [{ user: 'bob', text: see('pin=52.52014,13.40521', 'Crossing.') }],
      listed([['way', 123]]),
    )
    expect(located.changesetNotes).toEqual([{ author: 'bob', pin, body: 'Crossing.' }])
    expect(located.byObject.size).toBe(0)
    expect(located.unmatched).toEqual([])
  })

  test('sends a note whose object is not listed to unmatched', () => {
    const located = locateNotes(
      [{ user: 'alice', text: see('ref=way/999', 'Missing object.') }],
      listed([['way', 123]], [['way/123', ['highway']]]),
    )
    expect(located.unmatched).toEqual([
      { author: 'alice', ref: { type: 'way', id: 999 }, body: 'Missing object.' },
    ])
    expect(located.byObject.size).toBe(0)
    expect(located.changesetNotes).toEqual([])
  })

  test('sends a tag note whose key is not on the listed object to unmatched', () => {
    const located = locateNotes(
      [{ user: 'alice', text: see('ref=way/123/surface', 'No such key.') }],
      listed([['way', 123]], [['way/123', ['highway']]]),
    )
    expect(located.unmatched).toEqual([
      {
        author: 'alice',
        ref: { type: 'way', id: 123, key: 'surface' },
        body: 'No such key.',
      },
    ])
    expect(located.byObject.size).toBe(0)
  })

  test('attaches an object note when the object is listed', () => {
    const located = locateNotes(
      [{ user: 'alice', text: see('ref=node/4', 'Look here.') }],
      listed([['node', 4]], [['node/4', ['highway']]]),
    )
    expect(located.byObject.get('node/4')?.object).toEqual([
      { author: 'alice', ref: { type: 'node', id: 4 }, body: 'Look here.' },
    ])
    expect(located.unmatched).toEqual([])
  })

  test('treats an unstructured post (intro, no groups) as one changeset-level note', () => {
    const located = locateNotes(
      [{ id: 8, user: 'carol', date: '2026-08-02T00:00:00Z', text: 'Just a remark.' }],
      listed([['way', 123]]),
    )
    expect(located.changesetNotes).toEqual([
      {
        author: 'carol',
        date: '2026-08-02T00:00:00Z',
        postId: 8,
        body: 'Just a remark.',
      },
    ])
    expect(located.byObject.size).toBe(0)
    expect(located.unmatched).toEqual([])
  })

  test('stacks several posts targeting the same thing oldest first', () => {
    const located = locateNotes(
      [
        { id: 1, user: 'alice', date: '2026-08-01T10:00:00Z', text: see('ref=way/123', 'First.') },
        {
          id: 2,
          user: 'bob',
          date: '2026-08-01T11:00:00Z',
          text: see('ref=way/123/highway', 'Tag first.'),
        },
        { id: 3, user: 'carol', date: '2026-08-01T12:00:00Z', text: see('ref=way/123', 'Second.') },
      ],
      listed([['way', 123]], [['way/123', ['highway']]]),
    )
    expect(located.byObject.get('way/123')?.object.map((note) => note.body)).toEqual([
      'First.',
      'Second.',
    ])
    expect(
      located.byObject
        .get('way/123')
        ?.byKey.get('highway')
        ?.map((note) => note.body),
    ).toEqual(['Tag first.'])
  })

  test('returns empty buckets for empty comments', () => {
    expect(snapshot(locateNotes([], listed([['way', 123]])))).toEqual({
      changesetNotes: [],
      byObject: {},
      unmatched: [],
    })
  })

  test('never throws for invalid text and still places a leftover intro', () => {
    expect(() =>
      locateNotes(
        [
          { user: 'alice', text: '%%% not a url :::' },
          { user: 'bob', text: 'See not-a-url\nSee http://\nSee https://[' },
          { user: 'carol' },
        ],
        listed([['way', 123]]),
      ),
    ).not.toThrow()

    const located = locateNotes(
      [{ user: 'alice', text: '%%% not a url :::' }],
      listed([['way', 123]]),
    )
    expect(located.changesetNotes).toEqual([{ author: 'alice', body: '%%% not a url :::' }])
    expect(located.byObject.size).toBe(0)
    expect(located.unmatched).toEqual([])
  })

  test('takes author, date, and post id from the OSM comment, not the body', () => {
    const located = locateNotes(
      [
        {
          id: 42,
          user: 'mapper',
          date: '2026-01-15T08:00:00Z',
          text: `Posted by someone else in the text.\n\n${see('ref=way/123', 'Body.')}`,
        },
      ],
      listed([['way', 123]], [['way/123', []]]),
    )
    expect(located.changesetNotes[0]).toMatchObject({
      author: 'mapper',
      date: '2026-01-15T08:00:00Z',
      postId: 42,
      body: 'Posted by someone else in the text.',
    })
    expect(located.byObject.get('way/123')?.object[0]).toMatchObject({
      author: 'mapper',
      date: '2026-01-15T08:00:00Z',
      postId: 42,
      body: 'Body.',
    })
  })
})
