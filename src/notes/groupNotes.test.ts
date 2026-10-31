import { describe, expect, test } from 'vitest'
import { collectGroupThreads, groupNoteTargetLabel, withoutGroupNotes } from './groupNotes.ts'
import type { ObjectNotes, PublishedNote } from './locateNotes.ts'

const key = { type: 'node' as const, id: 1, key: 'man_made' }

function note(body: string, overrides: Partial<PublishedNote> = {}): PublishedNote {
  return { author: 'alice', body, ref: key, ...overrides }
}

function objectNotes(byKey: Record<string, PublishedNote[]>, object: PublishedNote[] = []) {
  return { object, byKey: new Map(Object.entries(byKey)) } satisfies ObjectNotes
}

describe('withoutGroupNotes', () => {
  test('returns the same object when no note is a group note', () => {
    const notes = objectNotes({ man_made: [note('own')] })
    expect(withoutGroupNotes(notes)).toBe(notes)
    expect(withoutGroupNotes(undefined)).toBeUndefined()
  })

  test('drops group notes, and a key that only had group notes', () => {
    const notes = objectNotes(
      { man_made: [note('group', { group: 2 })], highway: [note('a'), note('b', { group: 3 })] },
      [note('on the object')],
    )
    const result = withoutGroupNotes(notes)
    expect(result?.object).toEqual(notes.object)
    expect([...(result?.byKey.keys() ?? [])]).toEqual(['highway'])
    expect(result?.byKey.get('highway')?.map((item) => item.body)).toEqual(['a'])
  })
})

describe('collectGroupThreads', () => {
  const members = [
    { type: 'node', id: 1 },
    { type: 'node', id: 2 },
  ]

  test('collects one thread per key from every member, leaving plain notes out', () => {
    const threads = collectGroupThreads(
      members,
      new Map([
        ['node/1', objectNotes({ man_made: [note('group', { group: 2 }), note('plain')] })],
        ['node/2', objectNotes({ man_made: [note('own')], name: [note('other', { group: 2 })] })],
      ]),
    )
    expect(threads.map((thread) => thread.key)).toEqual(['man_made', 'name'])
    expect(threads[0]?.notes.map((item) => item.body)).toEqual(['group'])
    expect(threads[1]?.notes.map((item) => item.body)).toEqual(['other'])
  })

  test('merges notes of one key from two members, oldest first', () => {
    const threads = collectGroupThreads(
      members,
      new Map([
        [
          'node/1',
          objectNotes({ man_made: [note('second', { group: 2, date: '2026-02-01T00:00:00Z' })] }),
        ],
        [
          'node/2',
          objectNotes({ man_made: [note('first', { group: 2, date: '2026-01-01T00:00:00Z' })] }),
        ],
      ]),
    )
    expect(threads[0]?.notes.map((item) => item.body)).toEqual(['first', 'second'])
  })

  test('is empty for members without notes', () => {
    expect(collectGroupThreads(members, new Map())).toEqual([])
  })
})

test('groupNoteTargetLabel names the tag and the size', () => {
  expect(groupNoteTargetLabel('man_made', 2)).toBe('man_made · 2 objects')
})
