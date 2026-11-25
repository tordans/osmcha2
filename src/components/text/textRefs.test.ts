import { describe, expect, test } from 'vitest'
import { splitByTextRefs } from './textRefs.ts'

const all = { osmNotes: true, osmChangesets: true }

describe('splitByTextRefs', () => {
  test('cuts text into runs and references that join back to the text', () => {
    const text = 'a note 1, b https://osm.org/changeset/2 c'
    const segments = splitByTextRefs(text, all)
    expect(segments).toEqual([
      { type: 'text', text: 'a ', start: 0 },
      { type: 'note', text: 'note 1', start: 2, id: 1 },
      { type: 'text', text: ', b ', start: 8 },
      { type: 'changeset', text: 'https://osm.org/changeset/2', start: 12, id: 2 },
      { type: 'text', text: ' c', start: 39 },
    ])
    expect(segments.map((segment) => segment.text).join('')).toBe(text)
  })

  test('only looks for the kinds asked for', () => {
    const text = 'note 1 changeset 2'
    expect(splitByTextRefs(text, { osmNotes: false, osmChangesets: true })).toEqual([
      { type: 'text', text: 'note 1 ', start: 0 },
      { type: 'changeset', text: 'changeset 2', start: 7, id: 2 },
    ])
    expect(splitByTextRefs(text, { osmNotes: true, osmChangesets: false })).toEqual([
      { type: 'note', text: 'note 1', start: 0, id: 1 },
      { type: 'text', text: ' changeset 2', start: 6 },
    ])
  })

  test('returns one text segment when there is no reference', () => {
    expect(splitByTextRefs('nothing here', all)).toEqual([
      { type: 'text', text: 'nothing here', start: 0 },
    ])
    expect(splitByTextRefs('', all)).toEqual([])
  })
})
