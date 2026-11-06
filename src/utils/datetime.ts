import { tz } from '@date-fns/tz'
import {
  differenceInHours,
  differenceInMinutes,
  differenceInYears,
  format,
  formatDistanceStrict,
  isValid,
  parseISO,
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

/** Calendar `yyyy-MM-dd` of `date` in UTC, the day OSM and the server count by. */
export function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * The first (`start`) or last (`end`) second of the UTC day `yyyy-MM-dd`, so a range of days
 * includes both ends. `null` for a malformed day.
 */
export function utcDayEdge(isoDate: string, edge: 'start' | 'end'): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  if (!match) return null
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const date =
    edge === 'start'
      ? new Date(Date.UTC(year, month - 1, day))
      : new Date(Date.UTC(year, month - 1, day, 23, 59, 59))
  return isValid(date) && formatUtcDate(date) === isoDate ? date : null
}

/** Whether `timeZone` is UTC at `date` (no offset to explain). */
export function isUtcAt(date: Date, timeZone: string = browserTimeZone()): boolean {
  return (
    format(date, 'yyyy-MM-dd HH:mm', { in: tz(timeZone) }) ===
    format(date, 'yyyy-MM-dd HH:mm', { in: tz('UTC') })
  )
}

/** Wall-clock day and minute in `timeZone`, e.g. `1 Oct 2025, 02:00`. */
export function formatLocalDayTime(date: Date, timeZone: string = browserTimeZone()): string {
  return format(date, 'd MMM yyyy, HH:mm', { in: tz(timeZone) })
}

export { browserTimeZone }

/** Parse OSM / ISO-8601 timestamps (`…Z`, offsets, optional fractional seconds). */
export function parseOsmDate(value: string): Date {
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : new Date(value)
}

export type FormatAccountAgeOptions = {
  /** Drop the trailing " old" (visible meta label). */
  compact?: boolean
  /** One-letter units without " old" for narrow labels, e.g. `12d`, `>2y`. */
  short?: boolean
  /** Exact distance (tooltip); by default two years and up show as ">N years". */
  full?: boolean
}

/**
 * Compact mapper-account age for the review header.
 * Minutes while younger than an hour; then date-fns’ largest unit; 2+ years cap
 * unless `full` is set.
 */
export function formatAccountAge(
  created: Date,
  now: Date = new Date(),
  options: FormatAccountAgeOptions = {},
): string {
  const { compact = false, short = false, full = false } = options
  const suffix = compact || short ? '' : ' old'

  if (created >= now || differenceInMinutes(now, created) < 1) return 'just now'
  if (differenceInHours(now, created) < 1) {
    const minutes = differenceInMinutes(now, created)
    return short ? `${minutes}min` : `${minutes} min${suffix}`
  }
  const years = differenceInYears(now, created)
  // Two years and up: whole years with ">", since the months no longer matter for trust.
  if (!full && years >= 2) return short ? `>${years}y` : `>${years} years${suffix}`
  const distance = formatDistanceStrict(created, now, { roundingMethod: 'floor' })
  return short ? shortDistance(distance) : `${distance}${suffix}`
}

const SHORT_UNITS: Record<string, string> = {
  second: 's',
  minute: 'min',
  hour: 'h',
  day: 'd',
  month: 'mo',
  year: 'y',
}

/** `14 days` → `14d`, `8 months` → `8mo`: date-fns' strict distance with one-letter units. */
function shortDistance(distance: string) {
  const match = /^(\d+) (second|minute|hour|day|month|year)s?$/.exec(distance)
  if (!match) return distance
  return `${match[1]}${SHORT_UNITS[match[2]!]}`
}

/** Age of a past moment with one-letter units, e.g. `14d ago`, for narrow meta lines. */
export function formatShortAgo(date: Date, now: Date = new Date()): string {
  if (date >= now || differenceInMinutes(now, date) < 1) return 'just now'
  if (differenceInHours(now, date) < 1) return `${differenceInMinutes(now, date)}min ago`
  return `${shortDistance(formatDistanceStrict(date, now, { roundingMethod: 'floor' }))} ago`
}
