import { describe, expect, test } from 'vitest'
import { findOsmNoteRefs, osmNoteIds, osmNoteUrl, splitByOsmNoteRefs } from './osmNoteRefs.ts'

describe('osmNoteIds', () => {
  test('finds a note URL in a comment', () => {
    expect(
      osmNoteIds('Pflanze Wegen https://www.openstreetmap.org/note/5296798 bearbeitet.'),
    ).toEqual([5296798])
  })

  test('accepts URL variants', () => {
    expect(osmNoteIds('http://openstreetmap.org/note/1')).toEqual([1])
    expect(osmNoteIds('https://osm.org/note/22')).toEqual([22])
    expect(osmNoteIds('osm.org/note/333')).toEqual([333])
    expect(osmNoteIds('www.openstreetmap.org/note/4444')).toEqual([4444])
    expect(osmNoteIds('HTTPS://WWW.OPENSTREETMAP.ORG/NOTE/55')).toEqual([55])
  })

  test('accepts a path, query or hash after the id', () => {
    expect(osmNoteIds('https://www.openstreetmap.org/note/123/')).toEqual([123])
    expect(osmNoteIds('https://www.openstreetmap.org/note/123#map=19/52.5/13.4')).toEqual([123])
    expect(osmNoteIds('https://www.openstreetmap.org/note/123?foo=bar')).toEqual([123])
  })

  test('accepts plain forms', () => {
    expect(osmNoteIds('see note/123')).toEqual([123])
    expect(osmNoteIds('see note #123')).toEqual([123])
    expect(osmNoteIds('see note#123')).toEqual([123])
    expect(osmNoteIds('See Note 123')).toEqual([123])
    expect(osmNoteIds('Notiz 456 bearbeitet')).toEqual([456])
    expect(osmNoteIds('notiz #789')).toEqual([789])
  })

  test('returns unique ids in order of first appearance', () => {
    expect(
      osmNoteIds(
        'note 5 and https://www.openstreetmap.org/note/3 and note/5 and Note #3 and note 9',
      ),
    ).toEqual([5, 3, 9])
  })

  test('accepts ids of 1 to 12 digits only', () => {
    expect(osmNoteIds('note 123456789012')).toEqual([123456789012])
    expect(osmNoteIds('note 1234567890123')).toEqual([])
    expect(osmNoteIds('https://www.openstreetmap.org/note/1234567890123')).toEqual([])
  })

  test('is word-bounded', () => {
    expect(osmNoteIds('footnote 123')).toEqual([])
    expect(osmNoteIds('notes 123')).toEqual([])
    expect(osmNoteIds('note 123abc')).toEqual([])
    expect(osmNoteIds('denote/123')).toEqual([])
    expect(osmNoteIds('note')).toEqual([])
    expect(osmNoteIds('note #abc')).toEqual([])
  })

  test('ignores note-like paths of other sites', () => {
    expect(osmNoteIds('https://example.com/note/123')).toEqual([])
    expect(osmNoteIds('https://www.openstreetmap.org/changeset/123')).toEqual([])
    expect(osmNoteIds('https://notopenstreetmap.org/note/123')).toEqual([])
  })

  test('ignores empty input', () => {
    expect(osmNoteIds('')).toEqual([])
    expect(osmNoteIds(null)).toEqual([])
    expect(osmNoteIds(undefined)).toEqual([])
  })

  test('does not keep state between calls', () => {
    expect(osmNoteIds('note 1')).toEqual([1])
    expect(osmNoteIds('note 1')).toEqual([1])
  })
})

describe('findOsmNoteRefs', () => {
  test('reports ranges and kinds, dropping trailing punctuation of URLs', () => {
    const text = 'Fix (https://www.openstreetmap.org/note/12), then note 13.'
    const refs = findOsmNoteRefs(text)
    expect(refs).toEqual([
      {
        id: 12,
        start: 5,
        end: text.indexOf(')'),
        text: 'https://www.openstreetmap.org/note/12',
        kind: 'url',
      },
      {
        id: 13,
        start: text.indexOf('note 13'),
        end: text.length - 1,
        text: 'note 13',
        kind: 'plain',
      },
    ])
  })

  test('keeps a URL path but drops sentence punctuation after it', () => {
    const [ref] = findOsmNoteRefs('see https://www.openstreetmap.org/note/12/foo.')
    expect(ref?.text).toBe('https://www.openstreetmap.org/note/12/foo')
  })
})

describe('splitByOsmNoteRefs', () => {
  test('cuts text into runs and references that join back to the text', () => {
    const text = 'a note 1, b https://osm.org/note/2 c'
    const segments = splitByOsmNoteRefs(text)
    expect(segments).toEqual([
      { type: 'text', text: 'a ', start: 0 },
      { type: 'note', text: 'note 1', start: 2, id: 1 },
      { type: 'text', text: ', b ', start: 8 },
      { type: 'note', text: 'https://osm.org/note/2', start: 12, id: 2 },
      { type: 'text', text: ' c', start: 34 },
    ])
    expect(segments.map((segment) => segment.text).join('')).toBe(text)
  })

  test('returns one text segment when there is no reference', () => {
    expect(splitByOsmNoteRefs('nothing here')).toEqual([
      { type: 'text', text: 'nothing here', start: 0 },
    ])
    expect(splitByOsmNoteRefs('')).toEqual([])
  })
})

describe('osmNoteUrl', () => {
  test('points to the public note page', () => {
    expect(osmNoteUrl(5296798)).toBe('https://www.openstreetmap.org/note/5296798')
  })
})
