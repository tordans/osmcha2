import { describe, expect, test } from 'vitest'
import { parseRefParam, serializeRefParam } from './refParam.ts'
import { routerSearch } from './routerSearch.ts'

describe('refParam', () => {
  test('round-trips type/id and type/id/key', () => {
    expect(serializeRefParam({ type: 'way', id: 123 })).toBe('way/123')
    expect(parseRefParam('way/123')).toEqual({ type: 'way', id: 123 })

    expect(serializeRefParam({ type: 'way', id: 123, key: 'highway' })).toBe('way/123/highway')
    expect(parseRefParam('way/123/highway')).toEqual({ type: 'way', id: 123, key: 'highway' })

    expect(serializeRefParam({ type: 'node', id: 1, key: 'addr:street' })).toBe(
      'node/1/addr:street',
    )
    expect(parseRefParam('way/123/addr:street')).toEqual({
      type: 'way',
      id: 123,
      key: 'addr:street',
    })
    expect(parseRefParam('way/123/foo/bar')).toEqual({ type: 'way', id: 123, key: 'foo/bar' })
    expect(parseRefParam('relation/99')).toEqual({ type: 'relation', id: 99 })
  })

  test('keeps slashes and colons readable in serialized ref values', () => {
    const stringified = routerSearch.stringify({ ref: 'way/123/addr:street' })
    expect(stringified).toContain('ref=')
    expect(stringified).toContain('way/123/addr:street')
    expect(stringified).not.toContain('%2F')
    expect(stringified).not.toContain('%3A')
  })

  test('rejects empty, aliases, and malformed values', () => {
    expect(parseRefParam('')).toBeNull()
    expect(parseRefParam('n/123')).toBeNull()
    expect(parseRefParam('way-123')).toBeNull()
    expect(parseRefParam('WAY/123')).toBeNull()
    expect(parseRefParam('way/')).toBeNull()
    expect(parseRefParam('way/123/')).toBeNull()
    expect(parseRefParam('/way/123')).toBeNull()
    expect(parseRefParam('area/123')).toBeNull()
    expect(parseRefParam('way/abc')).toBeNull()
    expect(parseRefParam('way/0')).toBeNull()
    expect(parseRefParam('way/12.3')).toBeNull()
  })
})
