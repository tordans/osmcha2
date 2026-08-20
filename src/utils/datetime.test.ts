import { TZDate } from '@date-fns/tz'
import { describe, expect, test } from 'vitest'
import {
  formatLocalDate,
  formatLocalDateTime,
  localDateFromIsoDate,
  parseOsmDate,
  startOfLocalDay,
} from './datetime.ts'

const INSTANT = '2026-08-16T06:49:10.000Z'

describe('parseOsmDate', () => {
  test('parses OSM ISO timestamps with Z, offset, and fractional seconds', () => {
    expect(parseOsmDate('2026-08-16T06:49:10Z').toISOString()).toBe(INSTANT)
    expect(parseOsmDate(INSTANT).toISOString()).toBe(INSTANT)
    expect(parseOsmDate('2026-08-16T06:49:10+00:00').toISOString()).toBe(INSTANT)
  })
})

describe('formatLocalDateTime', () => {
  test('formats the instant in UTC', () => {
    expect(formatLocalDateTime(parseOsmDate(INSTANT), 'UTC')).toBe('16 Aug 2026, 06:49:10 GMT+0')
  })

  test('formats the same instant in Europe/Berlin', () => {
    expect(formatLocalDateTime(parseOsmDate(INSTANT), 'Europe/Berlin')).toBe(
      '16 Aug 2026, 08:49:10 GMT+2',
    )
  })
})

describe('formatLocalDate', () => {
  test('uses the calendar day in the given zone, not the UTC date', () => {
    const lateUtc = parseOsmDate('2026-08-16T22:30:00.000Z')
    expect(formatLocalDate(lateUtc, 'UTC')).toBe('2026-08-16')
    expect(formatLocalDate(lateUtc, 'Europe/Berlin')).toBe('2026-08-17')
  })
})

describe('localDateFromIsoDate', () => {
  test('is local midnight in the given zone', () => {
    const berlin = localDateFromIsoDate('2026-08-16', 'Europe/Berlin')
    expect(berlin).toBeInstanceOf(TZDate)
    expect(berlin?.toISOString()).toBe('2026-08-16T00:00:00.000+02:00')
  })
})

describe('startOfLocalDay', () => {
  test('is midnight in the given zone', () => {
    const lateUtc = parseOsmDate('2026-08-16T22:30:00.000Z')
    expect(startOfLocalDay(lateUtc, 'UTC').toISOString()).toBe('2026-08-16T00:00:00.000+00:00')
    expect(startOfLocalDay(lateUtc, 'Europe/Berlin').toISOString()).toBe(
      '2026-08-17T00:00:00.000+02:00',
    )
  })
})
