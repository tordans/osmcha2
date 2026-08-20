import { describe, expect, test } from 'vitest'
import { changesetTagsForDisplay, isVisibleChangesetTagKey } from './changesetTags.ts'

describe('isVisibleChangesetTagKey', () => {
  test('hides keys already shown on the review header', () => {
    expect(isVisibleChangesetTagKey('comment')).toBe(false)
    expect(isVisibleChangesetTagKey('created_by')).toBe(false)
    expect(isVisibleChangesetTagKey('host')).toBe(false)
  })

  test('hides iD walkthrough, warning, and resolved prefixes', () => {
    expect(isVisibleChangesetTagKey('ideditor:walkthrough_started')).toBe(false)
    expect(isVisibleChangesetTagKey('warnings:foo')).toBe(false)
    expect(isVisibleChangesetTagKey('resolved:crossing')).toBe(false)
  })

  test('keeps tags that are not shown elsewhere', () => {
    expect(isVisibleChangesetTagKey('hashtags')).toBe(true)
    expect(isVisibleChangesetTagKey('imagery_used')).toBe(true)
    expect(isVisibleChangesetTagKey('source')).toBe(true)
    expect(isVisibleChangesetTagKey('locale')).toBe(true)
  })
})

describe('changesetTagsForDisplay', () => {
  test('returns leftover metadata entries', () => {
    expect(
      changesetTagsForDisplay({
        comment: 'Fix sidewalks',
        created_by: 'iD 2.27',
        host: 'https://www.openstreetmap.org/edit',
        hashtags: '#hotosm',
        locale: 'de',
      }),
    ).toEqual([
      ['hashtags', '#hotosm'],
      ['locale', 'de'],
    ])
  })
})
