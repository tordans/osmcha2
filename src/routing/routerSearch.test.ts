import { describe, expect, it } from 'vitest'
import { routerSearch } from './routerSearch.ts'

describe('routerSearch', () => {
  it('round-trips pretty JSON filters', () => {
    const input = { filters: { a: 1 } }
    const serialized = routerSearch.stringify(input)
    expect(serialized).toContain('"a":1')
    expect(serialized).not.toContain('%7B')

    const parsed = routerSearch.parse(serialized.startsWith('?') ? serialized : `?${serialized}`)
    expect(parsed).toEqual(input)
  })

  it('keeps slashes readable in string values', () => {
    const input = { filters: { path: 'foo/bar' } }
    const serialized = routerSearch.stringify(input)
    expect(serialized).toContain('foo/bar')
    expect(serialized).not.toContain('%2F')

    const parsed = routerSearch.parse(serialized.startsWith('?') ? serialized : `?${serialized}`)
    expect(parsed).toEqual(input)
  })
})
