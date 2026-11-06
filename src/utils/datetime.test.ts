import { describe, expect, test } from 'vitest'
import {
  formatAccountAge,
  formatShortAgo,
  formatLocalDateTime,
  formatLocalDayTime,
  formatUtcDate,
  isUtcAt,
  parseOsmDate,
  utcDayEdge,
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
    expect(formatLocalDateTime(parseOsmDate(INSTANT), 'UTC')).toBe('16 Aug 2026, 06:49:10 UTC')
  })

  test('formats the same instant in Europe/Berlin', () => {
    expect(formatLocalDateTime(parseOsmDate(INSTANT), 'Europe/Berlin')).toBe(
      '16 Aug 2026, 08:49:10 Europe/Berlin',
    )
  })
})

describe('formatUtcDate', () => {
  test('is the UTC calendar day, whatever the browser zone', () => {
    expect(formatUtcDate(parseOsmDate('2026-08-16T22:30:00.000Z'))).toBe('2026-08-16')
  })
})

describe('utcDayEdge', () => {
  test('is the first and last second of the UTC day', () => {
    expect(utcDayEdge('2025-10-01', 'start')?.toISOString()).toBe('2025-10-01T00:00:00.000Z')
    expect(utcDayEdge('2025-10-01', 'end')?.toISOString()).toBe('2025-10-01T23:59:59.000Z')
  })

  test('is null for a day that does not exist', () => {
    expect(utcDayEdge('2025-02-30', 'start')).toBeNull()
    expect(utcDayEdge('', 'end')).toBeNull()
  })
})

describe('isUtcAt and formatLocalDayTime', () => {
  test('tell the browser time of a UTC day edge', () => {
    const start = parseOsmDate('2025-10-01T00:00:00Z')
    expect(isUtcAt(start, 'UTC')).toBe(true)
    expect(isUtcAt(start, 'Asia/Kolkata')).toBe(false)
    expect(formatLocalDayTime(start, 'Asia/Kolkata')).toBe('1 Oct 2025, 05:30')
  })
})

describe('formatAccountAge', () => {
  const now = parseOsmDate('2026-08-30T12:00:00.000Z')

  test('uses minutes until one hour, then date-fns units, then a 2-year cap', () => {
    expect(formatAccountAge(now, now)).toBe('just now')
    expect(formatAccountAge(parseOsmDate('2026-08-30T11:48:00.000Z'), now)).toBe('12 min old')
    expect(formatAccountAge(parseOsmDate('2026-08-30T11:00:00.000Z'), now)).toBe('1 hour old')
    expect(formatAccountAge(parseOsmDate('2026-08-30T07:00:00.000Z'), now)).toBe('5 hours old')
    expect(formatAccountAge(parseOsmDate('2026-08-18T12:00:00.000Z'), now)).toBe('12 days old')
    expect(formatAccountAge(parseOsmDate('2025-12-30T12:00:00.000Z'), now)).toBe('8 months old')
    expect(formatAccountAge(parseOsmDate('2025-08-30T12:00:00.000Z'), now)).toBe('1 year old')
    expect(formatAccountAge(parseOsmDate('2024-08-30T12:00:00.000Z'), now)).toBe('>2 years old')
    expect(formatAccountAge(parseOsmDate('2015-01-01T00:00:00.000Z'), now)).toBe('>11 years old')
  })

  test('compact drops the trailing " old"', () => {
    expect(formatAccountAge(parseOsmDate('2026-08-30T11:48:00.000Z'), now, { compact: true })).toBe(
      '12 min',
    )
    expect(formatAccountAge(parseOsmDate('2026-08-18T12:00:00.000Z'), now, { compact: true })).toBe(
      '12 days',
    )
    expect(formatAccountAge(parseOsmDate('2024-08-30T12:00:00.000Z'), now, { compact: true })).toBe(
      '>2 years',
    )
    expect(formatAccountAge(parseOsmDate('2025-12-30T12:00:00.000Z'), now, { compact: true })).toBe(
      '8 months',
    )
    expect(formatAccountAge(now, now, { compact: true })).toBe('just now')
  })

  test('short uses one-letter units', () => {
    expect(formatAccountAge(parseOsmDate('2026-08-30T11:48:00.000Z'), now, { short: true })).toBe(
      '12min',
    )
    expect(formatAccountAge(parseOsmDate('2026-08-18T12:00:00.000Z'), now, { short: true })).toBe(
      '12d',
    )
    expect(formatAccountAge(parseOsmDate('2025-12-30T12:00:00.000Z'), now, { short: true })).toBe(
      '8mo',
    )
    expect(formatAccountAge(parseOsmDate('2024-08-30T12:00:00.000Z'), now, { short: true })).toBe(
      '>2y',
    )
    expect(formatAccountAge(parseOsmDate('2011-05-03T12:00:00.000Z'), now, { short: true })).toBe(
      '>15y',
    )
  })

  test('full is uncapped past two years', () => {
    expect(formatAccountAge(parseOsmDate('2024-08-30T12:00:00.000Z'), now, { full: true })).toBe(
      '2 years old',
    )
    expect(formatAccountAge(parseOsmDate('2015-01-01T00:00:00.000Z'), now, { full: true })).toBe(
      '11 years old',
    )
  })
})

describe('formatShortAgo', () => {
  const now = parseOsmDate('2026-08-30T12:00:00.000Z')

  test('uses one-letter units', () => {
    expect(formatShortAgo(parseOsmDate('2026-08-16T12:00:00.000Z'), now)).toBe('14d ago')
    expect(formatShortAgo(parseOsmDate('2026-08-30T07:00:00.000Z'), now)).toBe('5h ago')
    expect(formatShortAgo(parseOsmDate('2026-08-30T11:48:00.000Z'), now)).toBe('12min ago')
    expect(formatShortAgo(now, now)).toBe('just now')
  })
})
