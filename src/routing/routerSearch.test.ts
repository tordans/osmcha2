import { describe, expect, it } from 'vitest'
import { routerSearch } from './routerSearch.ts'
import { osmchaSearchSchema } from './searchSchemas.ts'

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

describe('a posted group note link', () => {
  it('passes the search schema although the router parses group=2 as a number', () => {
    const parsed = routerSearch.parse('?ref=node/14331471295/man_made&group=2')
    expect(parsed).toEqual({ ref: 'node/14331471295/man_made', group: 2 })
    expect(osmchaSearchSchema.parse(parsed)).toEqual({
      page: 1,
      ref: 'node/14331471295/man_made',
      group: '2',
    })
  })
})
