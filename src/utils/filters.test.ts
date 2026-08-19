import MockDate from 'mockdate'
import { afterEach, describe, expect, it } from 'vitest'
import {
  appendDefaultDate,
  applyFilterChange,
  deserializeFiltersFromObject,
  lastDaysFilter,
  serializeFiltersToObject,
  serializeFiltersToQuery,
} from './filters.ts'

afterEach(() => {
  MockDate.reset()
})

describe('appendDefaultDate', () => {
  it('does not add date__gte when last_days is set, and still adds date__lte', () => {
    MockDate.set('2026-08-19T12:00:00.000Z')
    const result = appendDefaultDate({ last_days: lastDaysFilter(7) })
    expect(result.last_days).toEqual(lastDaysFilter(7))
    expect(result.date__gte).toBeUndefined()
    expect(result.date__lte).toBeDefined()
    expect(result.date__lte[0].value).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('treats last_days=0 as a present window (today) and skips date__gte', () => {
    const result = appendDefaultDate({ last_days: lastDaysFilter(0) })
    expect(result.last_days).toEqual(lastDaysFilter(0))
    expect(result.date__gte).toBeUndefined()
    expect(result.date__lte).toBeDefined()
  })

  it('still injects date__gte when last_days is absent', () => {
    const result = appendDefaultDate({})
    expect(result.date__gte).toBeDefined()
    expect(result.date__lte).toBeDefined()
  })

  it('keeps an explicit To and does not add date__gte when last_days is set', () => {
    const to = [{ label: '', value: '2026-08-19T00:00:00.000Z' }]
    const result = appendDefaultDate({ last_days: lastDaysFilter(2), date__lte: to })
    expect(result.date__gte).toBeUndefined()
    expect(result.date__lte).toBe(to)
  })
})

describe('serialize last_days', () => {
  it('emits last_days=7 in the query string without date__gte', () => {
    const forFetch = appendDefaultDate({ last_days: lastDaysFilter(7) })
    const query = serializeFiltersToQuery(forFetch)
    expect(query).toContain('last_days=7')
    expect(query).not.toContain('date__gte=')
    expect(query).toContain('date__lte=')
  })

  it('emits last_days=0 for today', () => {
    const query = serializeFiltersToQuery({ last_days: lastDaysFilter(0) })
    expect(query).toContain('last_days=0')
    expect(query).not.toContain('date__gte=')
  })

  it('does not emit last_days when the filter is empty', () => {
    expect(serializeFiltersToObject({})).not.toHaveProperty('last_days')
    expect(serializeFiltersToQuery({})).not.toContain('last_days=')
  })

  it('stores last_days on the AOI object without injecting dates', () => {
    expect(serializeFiltersToObject({ last_days: lastDaysFilter(7) })).toEqual({ last_days: '7' })
    expect(serializeFiltersToObject({ last_days: lastDaysFilter(0) })).toEqual({ last_days: '0' })
  })

  it('round-trips an AOI last_days key', () => {
    expect(deserializeFiltersFromObject({ last_days: '7' })).toEqual({
      last_days: [{ label: '7', value: '7' }],
    })
    expect(deserializeFiltersFromObject({ last_days: '0' })).toEqual({
      last_days: [{ label: '0', value: '0' }],
    })
  })
})

describe('applyFilterChange date exclusivity', () => {
  it('drops date__gte when setting last_days', () => {
    expect(
      applyFilterChange(
        { date__gte: [{ label: '2026-08-01', value: '2026-08-01' }] },
        'last_days',
        lastDaysFilter(7),
      ),
    ).toEqual({
      last_days: lastDaysFilter(7),
    })
  })

  it('drops last_days when setting date__gte', () => {
    expect(
      applyFilterChange({ last_days: lastDaysFilter(7) }, 'date__gte', [
        { label: '2026-08-01', value: '2026-08-01' },
      ]),
    ).toEqual({
      date__gte: [{ label: '2026-08-01', value: '2026-08-01' }],
    })
  })

  it('uses the empty date__gte hack when clearing From', () => {
    expect(
      applyFilterChange(
        {
          last_days: lastDaysFilter(7),
          date__gte: [{ label: '2026-08-01', value: '2026-08-01' }],
        },
        'date__gte',
      ),
    ).toEqual({
      date__gte: [{ label: '', value: '' }],
    })
  })

  it('keeps other filters when clearing last_days', () => {
    const to = [{ label: '', value: '2026-08-19T00:00:00.000Z' }]
    expect(applyFilterChange({ last_days: lastDaysFilter(7), date__lte: to }, 'last_days')).toEqual(
      {
        date__lte: to,
      },
    )
  })

  it('accepts last_days=0 as today', () => {
    expect(
      applyFilterChange(
        { date__gte: [{ label: '2026-08-01', value: '2026-08-01' }] },
        'last_days',
        lastDaysFilter(0),
      ),
    ).toEqual({
      last_days: lastDaysFilter(0),
    })
  })
})
