import { describe, expect, it } from 'vitest'
import { formatDistance, wikidataItemsOfRow } from './wikidataTags.ts'

describe('wikidataItemsOfRow', () => {
  it.each(['wikidata', 'brand:wikidata', 'name:etymology:wikidata', 'wikidata:old'])(
    'reads %s',
    (key) => {
      expect(wikidataItemsOfRow({ kind: 'unchanged', key, value: 'Q64' })).toEqual([
        { id: 'Q64', old: false },
      ])
    },
  )

  it('ignores keys that only contain the word', () => {
    expect(wikidataItemsOfRow({ kind: 'unchanged', key: 'wikidata_id', value: 'Q64' })).toEqual([])
  })

  it('reads several items and skips what is no item', () => {
    expect(
      wikidataItemsOfRow({ kind: 'added', key: 'wikidata', value: 'Q1; Q2;P31;Q1;nope' }),
    ).toEqual([
      { id: 'Q1', old: false },
      { id: 'Q2', old: false },
    ])
  })

  it('drops doubles in a changed value', () => {
    expect(
      wikidataItemsOfRow({ kind: 'changed', key: 'wikidata', oldValue: 'Q1', newValue: 'Q2;Q2' }),
    ).toEqual([
      { id: 'Q2', old: false },
      { id: 'Q1', old: true },
    ])
  })

  it('marks the items of a removed row and those a change dropped', () => {
    expect(wikidataItemsOfRow({ kind: 'removed', key: 'wikidata', value: 'Q1' })).toEqual([
      { id: 'Q1', old: true },
    ])
    expect(
      wikidataItemsOfRow({
        kind: 'changed',
        key: 'wikidata',
        oldValue: 'Q1;Q2',
        newValue: 'Q2;Q3',
      }),
    ).toEqual([
      { id: 'Q2', old: false },
      { id: 'Q3', old: false },
      { id: 'Q1', old: true },
    ])
  })
})

describe('formatDistance', () => {
  it.each([
    [0, '0 m'],
    [84.4, '84 m'],
    [999, '999 m'],
    [1240, '1.2 km'],
    [12400, '12 km'],
  ])('%d m', (meters, text) => {
    expect(formatDistance(meters)).toBe(text)
  })
})
