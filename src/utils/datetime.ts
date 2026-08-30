import { TZDate, tz } from '@date-fns/tz'
import {
  differenceInHours,
  differenceInMinutes,
  differenceInYears,
  format,
  formatDistanceStrict,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns'

/** Browser IANA zone, falling back to UTC when unavailable (SSR / tests). */
function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/** Local wall-clock datetime for tooltips, e.g. `16 Aug 2026, 08:49:10 Europe/Berlin`. */
export function formatLocalDateTime(date: Date, timeZone: string = browserTimeZone()): string {
  return `${format(date, 'd MMM yyyy, HH:mm:ss', { in: tz(timeZone) })} ${timeZone}`
}

/** Calendar `yyyy-MM-dd` in `timeZone` (not a UTC slice). */
export function formatLocalDate(date: Date, timeZone: string = browserTimeZone()): string {
  return format(date, 'yyyy-MM-dd', { in: tz(timeZone) })
}

/** Local midnight for a stored `yyyy-MM-dd` calendar day. */
export function localDateFromIsoDate(
  isoDate: string,
  timeZone: string = browserTimeZone(),
): Date | null {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return null
  const date = new TZDate(year, month - 1, day, 0, 0, 0, timeZone)
  return isValid(date) ? date : null
}

/** Start of the calendar day in `timeZone` for `date`. */
export function startOfLocalDay(
  date: Date = new Date(),
  timeZone: string = browserTimeZone(),
): Date {
  return startOfDay(new TZDate(date, timeZone))
}

/** Parse OSM / ISO-8601 timestamps (`…Z`, offsets, optional fractional seconds). */
export function parseOsmDate(value: string): Date {
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : new Date(value)
}

/**
 * Compact mapper-account age for the review header.
 * Minutes while younger than an hour; then date-fns’ largest unit; 2+ years cap.
 */
export function formatAccountAge(created: Date, now: Date = new Date()): string {
  if (created >= now || differenceInMinutes(now, created) < 1) return 'just now'
  if (differenceInHours(now, created) < 1) {
    return `${differenceInMinutes(now, created)} min old`
  }
  if (differenceInYears(now, created) >= 2) return '>2 years old'
  return `${formatDistanceStrict(created, now, { roundingMethod: 'floor' })} old`
}
