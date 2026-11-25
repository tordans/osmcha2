import { describe, expect, test } from 'vitest'
import { findOsmChangesetRefs } from './osmChangesetRefs.ts'

const ids = (text: string) => findOsmChangesetRefs(text).map((ref) => ref.id)

describe('findOsmChangesetRefs', () => {
  test('finds a changeset URL in a changeset comment', () => {
    const text =
      'Ergänzung zu https://www.openstreetmap.org/changeset/191867893 - inkl. Detailverbesserungen'
    expect(findOsmChangesetRefs(text)).toEqual([
      {
        id: 191867893,
        start: 13,
        end: 62,
        text: 'https://www.openstreetmap.org/changeset/191867893',
      },
    ])
  })

  test('accepts URL variants', () => {
    expect(ids('http://openstreetmap.org/changeset/1')).toEqual([1])
    expect(ids('https://osm.org/changeset/22')).toEqual([22])
    expect(ids('osm.org/changeset/333')).toEqual([333])
    expect(ids('www.openstreetmap.org/changeset/4444')).toEqual([4444])
    expect(ids('HTTPS://WWW.OPENSTREETMAP.ORG/CHANGESET/55')).toEqual([55])
  })

  test('accepts a path, query or hash after the id and drops trailing punctuation', () => {
    expect(ids('https://www.openstreetmap.org/changeset/123/')).toEqual([123])
    expect(ids('https://www.openstreetmap.org/changeset/123#map=19/52.5/13.4')).toEqual([123])
    const [ref] = findOsmChangesetRefs('(see https://www.openstreetmap.org/changeset/123).')
    expect(ref?.text).toBe('https://www.openstreetmap.org/changeset/123')
  })

  test('accepts plain forms', () => {
    expect(ids('see changeset/123')).toEqual([123])
    expect(ids('see changeset #123')).toEqual([123])
    expect(ids('see changeset#123')).toEqual([123])
    expect(ids('See Changeset 123')).toEqual([123])
    expect(ids('Änderungssatz 456 korrigiert')).toEqual([456])
  })

  test('ignores look-alikes', () => {
    expect(ids('https://www.openstreetmap.org/note/123')).toEqual([])
    expect(ids('https://example.com/openstreetmap.org/changeset/1')).toEqual([])
    expect(ids('https://osmcha.org/changesets/123')).toEqual([])
    expect(ids('mychangeset 12')).toEqual([])
    expect(ids('changeset 12abc')).toEqual([])
    expect(ids('changeset 0')).toEqual([])
    expect(ids('changesets')).toEqual([])
  })

  test('finds several references in order', () => {
    expect(ids('changeset 1 and https://osm.org/changeset/2')).toEqual([1, 2])
  })
})
