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

describe('routerSearch string values', () => {
  const roundTrip = (search: Record<string, unknown>) => {
    const serialized = routerSearch.stringify(search)
    return routerSearch.parse(serialized)
  }

  it.each([
    '2.30',
    '1e3',
    'null',
    '-0',
    'true',
    '"fix typo"',
    '12345678901234567890',
    '007',
    '[1,2]',
    '{"a":1}',
  ])('keeps the string %s unchanged', (value) => {
    expect(roundTrip({ comment: value })).toEqual({ comment: value })
  })

  it('keeps plain strings readable and unquoted', () => {
    expect(routerSearch.stringify({ users: 'Alice' })).toBe('?users=Alice')
  })

  it('round-trips usernames with spaces, unicode, & and +', () => {
    for (const users of ['Jane Doe', 'Müller 日本', 'a&b=c', 'a+b', 'Jane Doe, a&b+c']) {
      expect(roundTrip({ users })).toEqual({ users })
    }
  })

  it('still parses existing URLs to the same values', () => {
    expect(routerSearch.parse('?users=Alice&page=5&map=3/1/2&flag=true&n=1.5')).toEqual({
      users: 'Alice',
      page: 5,
      map: '3/1/2',
      flag: true,
      n: 1.5,
    })
  })

  it('round-trips numbers as numbers', () => {
    expect(roundTrip({ page: 5, ids: [1, 2] })).toEqual({ page: 5, ids: [1, 2] })
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
