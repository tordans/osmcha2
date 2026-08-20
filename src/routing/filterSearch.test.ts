import { describe, expect, it } from 'vitest'
import {
  filtersFromSearch,
  listSearchFromFilters,
  migrateLegacyFilterSearch,
  serializeFiltersToSearch,
  stripFilterSearch,
  withFilters,
} from './filterSearch.ts'
import { routerSearch } from './routerSearch.ts'
import type { OsmchaSearch } from './searchSchemas.ts'

describe('serializeFiltersToSearch', () => {
  it('writes comma-separated scalar filters as top-level search params', () => {
    expect(
      serializeFiltersToSearch({
        uids: [{ label: '11881', value: '11881' }],
        comment: [{ label: '#hot', value: '#hot' }],
      }),
    ).toEqual({ uids: '11881', comment: '#hot' })
  })

  it('keeps the empty date__gte unbounded-from hack', () => {
    expect(
      serializeFiltersToSearch({
        uids: [{ label: '11881', value: '11881' }],
        date__gte: [{ label: '', value: '' }],
      }),
    ).toEqual({ uids: '11881', date__gte: '' })
  })
})

describe('filtersFromSearch', () => {
  it('rebuilds {label,value} filters from search params', () => {
    expect(filtersFromSearch({ page: 1, uids: '11881', date__gte: '' } as OsmchaSearch)).toEqual({
      uids: [{ label: '11881', value: '11881' }],
      date__gte: [{ label: '', value: '' }],
    })
  })

  it('coerces numeric JSON parse values', () => {
    expect(filtersFromSearch({ page: 1, uids: 11881 } as OsmchaSearch)).toEqual({
      uids: [{ label: '11881', value: '11881' }],
    })
  })
})

describe('listSearchFromFilters', () => {
  it('round-trips through pretty router search', () => {
    const search = listSearchFromFilters({
      uids: [{ label: '11881', value: '11881' }],
      date__gte: [{ label: '', value: '' }],
    })
    const serialized = routerSearch.stringify(search)
    expect(serialized).toContain('uids=11881')
    expect(serialized).not.toContain('filters=')
    expect(serialized).not.toContain('%7B')

    const parsed = routerSearch.parse(serialized.startsWith('?') ? serialized : `?${serialized}`)
    expect(filtersFromSearch(parsed as OsmchaSearch).uids).toEqual([
      { label: '11881', value: '11881' },
    ])
  })
})

describe('migrateLegacyFilterSearch', () => {
  it('flattens a legacy filters blob on the list', () => {
    const migrated = migrateLegacyFilterSearch('/', {
      page: 1,
      filters: {
        uids: [{ label: '11881', value: '11881' }],
        date__gte: [{ label: '', value: '' }],
      },
    } as OsmchaSearch)
    expect(migrated?.pathname).toBe('/')
    expect(migrated?.search).toMatchObject({ uids: '11881', date__gte: '' })
    expect(migrated?.search.filters).toBeUndefined()
  })

  it('moves list filters off /user onto /', () => {
    const migrated = migrateLegacyFilterSearch('/user', {
      page: 1,
      filters: {
        uids: [{ label: '11881', value: '11881' }],
        date__gte: [{ label: '', value: '' }],
      },
    } as OsmchaSearch)
    expect(migrated).toEqual({
      pathname: '/',
      search: expect.objectContaining({ uids: '11881', date__gte: '' }),
    })
  })

  it('does not redirect a clean account page', () => {
    expect(migrateLegacyFilterSearch('/user', { page: 1 } as OsmchaSearch)).toBeNull()
  })

  it('moves flattened filter params off /user onto /', () => {
    expect(migrateLegacyFilterSearch('/user', { page: 1, uids: '11881' } as OsmchaSearch)).toEqual({
      pathname: '/',
      search: expect.objectContaining({ uids: '11881' }),
    })
  })
})

describe('withFilters / stripFilterSearch', () => {
  it('replaces previous filter keys instead of merging', () => {
    const current = { page: 2, aoi: '9', uids: '1', comment: 'old' } as OsmchaSearch
    expect(withFilters(current, { users: [{ label: 'ann', value: 'ann' }] })).toEqual({
      page: 2,
      aoi: '9',
      users: 'ann',
    })
    expect(stripFilterSearch(current)).toEqual({ page: 2, aoi: '9' })
  })
})
