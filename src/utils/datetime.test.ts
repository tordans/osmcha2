import { TZDate } from '@date-fns/tz'
import { describe, expect, test } from 'vitest'
import {
  formatAccountAge,
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
    expect(formatLocalDateTime(parseOsmDate(INSTANT), 'UTC')).toBe('16 Aug 2026, 06:49:10 UTC')
  })

  test('formats the same instant in Europe/Berlin', () => {
    expect(formatLocalDateTime(parseOsmDate(INSTANT), 'Europe/Berlin')).toBe(
      '16 Aug 2026, 08:49:10 Europe/Berlin',
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
    expect(formatAccountAge(parseOsmDate('2015-01-01T00:00:00.000Z'), now)).toBe('>2 years old')
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
    expect(formatAccountAge(now, now, { compact: true })).toBe('just now')
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
