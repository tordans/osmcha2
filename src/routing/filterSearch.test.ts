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

  it('writes order as field,direction instead of order_by', () => {
    expect(
      serializeFiltersToSearch({
        uids: [{ label: '11881', value: '11881' }],
        order_by: [{ label: 'Descending Date', value: '-date' }],
      }),
    ).toEqual({ uids: '11881', order: 'date,desc' })
    expect(
      serializeFiltersToSearch({
        order_by: [{ label: 'Ascending Date', value: 'date' }],
      }),
    ).toEqual({ order: 'date,asc' })
  })

  it('writes the same search key for equivalent order filters', () => {
    const first = serializeFiltersToSearch({
      order_by: [{ label: 'Descending Date', value: '-date' }],
    })
    const second = serializeFiltersToSearch({
      order_by: [{ label: '-date', value: '-date' }],
    })
    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
    expect(first).toEqual({ order: 'date,desc' })
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

  it('ignores ref, pin, and layers chrome so they are not filter keys', () => {
    expect(
      filtersFromSearch({
        page: 1,
        ref: 'way/123',
        pin: '52.5,13.4',
        layers: 'spyglass',
        uids: '11881',
      } as OsmchaSearch),
    ).toEqual({
      uids: [{ label: '11881', value: '11881' }],
    })
  })

  it('rebuilds order_by from order=date,desc', () => {
    expect(filtersFromSearch({ page: 1, order: 'date,desc' } as OsmchaSearch)).toEqual({
      order_by: [{ label: '-date', value: '-date' }],
    })
    expect(filtersFromSearch({ page: 1, order: 'date,asc' } as OsmchaSearch)).toEqual({
      order_by: [{ label: 'date', value: 'date' }],
    })
  })

  it('ignores a malformed order param', () => {
    expect(filtersFromSearch({ page: 1, order: '-date' } as OsmchaSearch)).toEqual({})
    expect(filtersFromSearch({ page: 1, order: 'date' } as OsmchaSearch)).toEqual({})
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

  it('round-trips order=date,desc without encoding the comma', () => {
    const search = listSearchFromFilters({
      order_by: [{ label: 'Descending Date', value: '-date' }],
    })
    const serialized = routerSearch.stringify(search)
    expect(serialized).toContain('order=date,desc')
    expect(serialized).not.toContain('order_by')
    expect(serialized).not.toContain('%2C')

    const parsed = routerSearch.parse(serialized.startsWith('?') ? serialized : `?${serialized}`)
    expect(filtersFromSearch(parsed as OsmchaSearch).order_by).toEqual([
      { label: '-date', value: '-date' },
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

  it('does not treat OSM OAuth callback params as list filters', () => {
    expect(
      migrateLegacyFilterSearch('/authorized', {
        page: 1,
        code: 'oauth-code',
        state: 'oauth-state',
      } as OsmchaSearch),
    ).toBeNull()
  })

  it('keeps /authorized on the callback even when list filters are also present', () => {
    expect(
      migrateLegacyFilterSearch('/authorized', {
        page: 1,
        code: 'oauth-code',
        uids: '11881',
      } as OsmchaSearch),
    ).toBeNull()
  })

  it('moves flattened filter params off /user onto /', () => {
    expect(migrateLegacyFilterSearch('/user', { page: 1, uids: '11881' } as OsmchaSearch)).toEqual({
      pathname: '/',
      search: expect.objectContaining({ uids: '11881' }),
    })
  })

  it('migrates flattened order_by=-date to order=date,desc', () => {
    const migrated = migrateLegacyFilterSearch('/', {
      page: 1,
      order_by: '-date',
    } as OsmchaSearch)
    expect(migrated?.pathname).toBe('/')
    expect(migrated?.search).toMatchObject({ order: 'date,desc' })
    expect(migrated?.search).not.toHaveProperty('order_by')
  })

  it('migrates order_by inside a filters blob', () => {
    const migrated = migrateLegacyFilterSearch('/', {
      page: 1,
      filters: {
        uids: [{ label: '11881', value: '11881' }],
        order_by: [{ label: 'Descending Date', value: '-date' }],
      },
    } as OsmchaSearch)
    expect(migrated?.search).toMatchObject({ uids: '11881', order: 'date,desc' })
    expect(migrated?.search).not.toHaveProperty('order_by')
    expect(migrated?.search.filters).toBeUndefined()
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

  it('keeps chrome order unless the next filters set order_by', () => {
    const current = { page: 2, order: 'date,desc', uids: '1' } as OsmchaSearch
    expect(withFilters(current, { users: [{ label: 'ann', value: 'ann' }] })).toEqual({
      page: 2,
      order: 'date,desc',
      users: 'ann',
    })
    expect(
      withFilters(current, {
        users: [{ label: 'ann', value: 'ann' }],
        order_by: [{ label: 'Ascending Date', value: 'date' }],
      }),
    ).toEqual({
      page: 2,
      order: 'date,asc',
      users: 'ann',
    })
    expect(stripFilterSearch(current)).toEqual({ page: 2, order: 'date,desc' })
  })

  it('keeps ref, pin, and layers as chrome like map and order', () => {
    const current = {
      page: 2,
      map: '12/52.5/13.4',
      order: 'date,desc',
      ref: 'way/123',
      pin: '52.5,13.4',
      layers: 'spyglass',
      uids: '11881',
    } as OsmchaSearch
    expect(stripFilterSearch(current)).toEqual({
      page: 2,
      map: '12/52.5/13.4',
      order: 'date,desc',
      ref: 'way/123',
      pin: '52.5,13.4',
      layers: 'spyglass',
    })
  })
})
