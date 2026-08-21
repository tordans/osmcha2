import { describe, expect, test } from 'vitest'
import { isOsmChangesetOpen } from './isOsmChangesetOpen.ts'

describe('isOsmChangesetOpen', () => {
  test('is false without OSM metadata', () => {
    expect(isOsmChangesetOpen(undefined)).toBe(false)
    expect(isOsmChangesetOpen({})).toBe(false)
  })

  test('is false for a closed changeset', () => {
    expect(
      isOsmChangesetOpen({
        changeset: { open: false, closed_at: '2026-08-20T10:00:00Z' },
      }),
    ).toBe(false)
  })

  test('is true only when OSM reports the changeset still open', () => {
    expect(isOsmChangesetOpen({ changeset: { open: true } })).toBe(true)
  })
})
