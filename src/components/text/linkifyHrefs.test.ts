import { find } from 'linkifyjs'
import { describe, expect, test } from 'vitest'
import { hashtagCommentSearch, osmUserHrefFromMention } from './linkifyHrefs.ts'
import './osmHashtagPlugin.ts'

describe('osmUserHrefFromMention', () => {
  test('maps linkify /username hrefs to OSM user pages', () => {
    expect(osmUserHrefFromMention('/nammala')).toBe('https://www.openstreetmap.org/user/nammala')
  })
})

describe('hashtagCommentSearch', () => {
  test('filters the changeset list by the hashtag comment text', () => {
    expect(hashtagCommentSearch('#hotosm-project-2999')).toEqual({
      comment: '#hotosm-project-2999',
    })
  })
})

describe('OSM hashtag plugin', () => {
  test('keeps hyphens in HOT-style hashtags', () => {
    const hits = find('#hotosm-project-2999 also #MissingMaps', 'hashtag')
    expect(hits.map((hit) => hit.value)).toEqual(['#hotosm-project-2999', '#MissingMaps'])
  })
})
