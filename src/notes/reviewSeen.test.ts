import { describe, expect, test } from 'vitest'
import {
  DRAFT_MAX_AGE_MS,
  draftsForObject,
  emptyUserNotes,
  evictUserNotes,
  isObjectSeenCollapsed,
  latestForeignNoteAt,
  SEEN_LRU_CAP,
} from './reviewSeen.ts'

describe('isObjectSeenCollapsed', () => {
  test('missing seenAt never collapses', () => {
    expect(isObjectSeenCollapsed({})).toBe(false)
    expect(isObjectSeenCollapsed({ latestForeignNoteAt: '2026-01-02T00:00:00Z' })).toBe(false)
  })

  test('collapses when there is no foreign note, or seenAt is newer or equal', () => {
    expect(isObjectSeenCollapsed({ seenAt: '2026-01-02T00:00:00Z' })).toBe(true)
    expect(
      isObjectSeenCollapsed({
        seenAt: '2026-01-02T00:00:00Z',
        latestForeignNoteAt: '2026-01-02T00:00:00Z',
      }),
    ).toBe(true)
    expect(
      isObjectSeenCollapsed({
        seenAt: '2026-01-03T00:00:00Z',
        latestForeignNoteAt: '2026-01-02T00:00:00Z',
      }),
    ).toBe(true)
  })

  test('a newer foreign note re-expands', () => {
    expect(
      isObjectSeenCollapsed({
        seenAt: '2026-01-01T00:00:00Z',
        latestForeignNoteAt: '2026-01-02T00:00:00Z',
      }),
    ).toBe(false)
  })
})

describe('latestForeignNoteAt', () => {
  test('treats missing currentUser as all notes foreign', () => {
    expect(
      latestForeignNoteAt([
        { author: 'alice', date: '2026-01-01T00:00:00Z' },
        { author: 'bob', date: '2026-01-03T00:00:00Z' },
      ]),
    ).toBe('2026-01-03T00:00:00Z')
  })

  test('ignores the current user so own notes do not re-expand', () => {
    expect(
      latestForeignNoteAt(
        [
          { author: 'me', date: '2026-01-09T00:00:00Z' },
          { author: 'other', date: '2026-01-02T00:00:00Z' },
        ],
        'me',
      ),
    ).toBe('2026-01-02T00:00:00Z')
  })

  test('skips notes with no date', () => {
    expect(
      latestForeignNoteAt([{ author: 'alice' }, { author: 'bob', date: '2026-01-01T00:00:00Z' }]),
    ).toBe('2026-01-01T00:00:00Z')
  })
})

describe('draftsForObject', () => {
  test('returns notes whose ref matches the object, including tag-level refs', () => {
    const draft = {
      intro: '',
      updatedAt: 1,
      notes: [
        { id: '1', body: 'object', ref: { type: 'way' as const, id: 1 } },
        { id: '2', body: 'tag', ref: { type: 'way' as const, id: 1, key: 'highway' } },
        { id: '3', body: 'other', ref: { type: 'way' as const, id: 2 } },
      ],
    }
    expect(draftsForObject(draft, 'way', 1).map((note) => note.id)).toEqual(['1', '2'])
    expect(draftsForObject(undefined, 'way', 1)).toEqual([])
  })
})

describe('evictUserNotes', () => {
  test('drops a changeset draft older than 21 days', () => {
    const now = 1_700_000_000_000
    const user = emptyUserNotes()
    user.drafts['1'] = { intro: 'old', notes: [], updatedAt: now - DRAFT_MAX_AGE_MS - 1 }
    user.drafts['2'] = { intro: 'new', notes: [], updatedAt: now }
    const next = evictUserNotes(user, now)
    expect(next.drafts['1']).toBeUndefined()
    expect(next.drafts['2']?.intro).toBe('new')
  })

  test('keeps the 40 most recently touched seen maps', () => {
    const user = emptyUserNotes()
    for (let index = 0; index < SEEN_LRU_CAP + 5; index += 1) {
      const id = String(index)
      user.seen[id] = { 'way/1': '2026-01-01T00:00:00Z' }
      user.seenTouchedAt[id] = index
    }
    const next = evictUserNotes(user)
    expect(Object.keys(next.seen)).toHaveLength(SEEN_LRU_CAP)
    expect(next.seen['0']).toBeUndefined()
    expect(next.seen[String(SEEN_LRU_CAP + 4)]).toBeDefined()
  })
})
