import { TZDate } from '@date-fns/tz'
import { format, isValid, parseISO, startOfDay } from 'date-fns'

/** Browser IANA zone, falling back to UTC when unavailable (SSR / tests). */
function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/** Local wall-clock datetime for tooltips, e.g. `16 Aug 2026, 08:49:10 GMT+2`. */
export function formatLocalDateTime(date: Date, timeZone: string = browserTimeZone()): string {
  return format(new TZDate(date, timeZone), 'd MMM yyyy, HH:mm:ss zzz')
}

/** Calendar `yyyy-MM-dd` in `timeZone` (not a UTC slice). */
export function formatLocalDate(date: Date, timeZone: string = browserTimeZone()): string {
  return format(new TZDate(date, timeZone), 'yyyy-MM-dd')
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
