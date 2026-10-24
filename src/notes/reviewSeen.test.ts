import { describe, expect, test } from 'vitest'
import {
  AUTO_SEEN_AT,
  DRAFT_MAX_AGE_MS,
  draftsForObject,
  effectiveSeenAt,
  effectiveSeenMap,
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

describe('effectiveSeenAt', () => {
  test('a minor move counts as seen by itself', () => {
    expect(effectiveSeenAt({ minorMove: true, unseenOverride: false })).toBe(AUTO_SEEN_AT)
  })

  test('other objects are not seen until the reviewer says so', () => {
    expect(effectiveSeenAt({ minorMove: false, unseenOverride: false })).toBeUndefined()
    expect(
      effectiveSeenAt({ seenAt: '2026-01-01T00:00:00Z', minorMove: false, unseenOverride: false }),
    ).toBe('2026-01-01T00:00:00Z')
  })

  test('un-seeing a minor move keeps it un-seen', () => {
    expect(effectiveSeenAt({ minorMove: true, unseenOverride: true })).toBeUndefined()
  })

  test('the reviewer’s own mark wins, and an automatic seen state is older than any note', () => {
    expect(
      effectiveSeenAt({ seenAt: '2026-01-01T00:00:00Z', minorMove: true, unseenOverride: true }),
    ).toBe('2026-01-01T00:00:00Z')
    expect(
      isObjectSeenCollapsed({
        seenAt: AUTO_SEEN_AT,
        latestForeignNoteAt: '2026-01-01T00:00:00Z',
      }),
    ).toBe(false)
  })
})

describe('effectiveSeenMap', () => {
  const stored = { 'way/1': '2026-01-01T00:00:00Z' }

  test('adds minor moves without touching the stored map', () => {
    const merged = effectiveSeenMap(stored, undefined, ['node/5', 'way/1'])
    expect(merged).toEqual({ 'way/1': '2026-01-01T00:00:00Z', 'node/5': AUTO_SEEN_AT })
    expect(stored).toEqual({ 'way/1': '2026-01-01T00:00:00Z' })
  })

  test('leaves out minor moves the reviewer un-saw', () => {
    expect(effectiveSeenMap(undefined, ['node/5'], ['node/5', 'node/6'])).toEqual({
      'node/6': AUTO_SEEN_AT,
    })
  })

  test('returns the stored map itself when nothing is added', () => {
    expect(effectiveSeenMap(stored, undefined, [])).toBe(stored)
    expect(effectiveSeenMap(stored, undefined, ['way/1'])).toBe(stored)
    expect(effectiveSeenMap(undefined, ['node/5'], ['node/5'])).toBeUndefined()
  })
})

describe('evictUserNotes overrides', () => {
  test('keeps and drops overrides together with the seen map', () => {
    const user = emptyUserNotes()
    for (let index = 0; index < SEEN_LRU_CAP + 1; index += 1) {
      const id = String(index)
      user.unseenOverrides[id] = ['node/5']
      user.seenTouchedAt[id] = index
    }
    const next = evictUserNotes(user)
    expect(next.unseenOverrides['0']).toBeUndefined()
    expect(next.unseenOverrides[String(SEEN_LRU_CAP)]).toEqual(['node/5'])
  })
})
