import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getIsChangesetRead,
  getReadChangesetsActions,
  pruneReadAt,
  READ_CHANGESET_MAX_ENTRIES,
} from './read-changesets-store.ts'

const DAY_MS = 24 * 60 * 60 * 1000
const NOW = Date.UTC(2026, 9, 23)

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('pruneReadAt', () => {
  it('drops entries older than 30 days and keeps recent ones', () => {
    const result = pruneReadAt({ '1': NOW - 31 * DAY_MS, '2': NOW - 29 * DAY_MS, '3': NOW }, NOW)

    expect(result).toEqual({ '2': NOW - 29 * DAY_MS, '3': NOW })
  })

  it('keeps only the newest entries when over the cap', () => {
    const readAt: Record<string, number> = {}
    for (let id = 1; id <= READ_CHANGESET_MAX_ENTRIES + 100; id++) {
      readAt[String(id)] = NOW - id * 1000
    }

    const result = pruneReadAt(readAt, NOW)

    expect(Object.keys(result)).toHaveLength(READ_CHANGESET_MAX_ENTRIES)
    expect(result['1']).toBe(NOW - 1000)
    expect(result[String(READ_CHANGESET_MAX_ENTRIES)]).toBeDefined()
    expect(result[String(READ_CHANGESET_MAX_ENTRIES + 1)]).toBeUndefined()
  })
})

describe('read changesets store', () => {
  it('marks a changeset as read and only that changeset', () => {
    const id = 910001

    expect(getIsChangesetRead(id)).toBe(false)

    getReadChangesetsActions().markRead(id)

    expect(getIsChangesetRead(id)).toBe(true)
    expect(getIsChangesetRead(id + 1)).toBe(false)
  })

  it('writes the read timestamp to localStorage', () => {
    const id = 910002
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    getReadChangesetsActions().markRead(id)

    expect(setItem).toHaveBeenCalledWith(
      'osmcha-read-changesets',
      expect.stringContaining(`"${id}":${NOW}`),
    )
  })

  it('forgets a changeset once its read mark is older than 30 days', () => {
    const oldId = 910003
    const newId = 910004

    getReadChangesetsActions().markRead(oldId)
    vi.setSystemTime(NOW + 31 * DAY_MS)
    getReadChangesetsActions().markRead(newId)

    expect(getIsChangesetRead(oldId)).toBe(false)
    expect(getIsChangesetRead(newId)).toBe(true)
  })
})
