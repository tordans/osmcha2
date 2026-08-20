import { sub } from 'date-fns'
import { DEFAULT_FROM_DATE, DEFAULT_TO_DATE } from '../config/constants.ts'
import { startOfLocalDay } from './datetime.ts'

export function validateFilters(filters: any): boolean {
  if (!filters || typeof filters !== 'object') {
    throw new Error('The filters that you applied were not correct.')
  }

  let valid = true
  for (const key of Object.keys(filters)) {
    const value = filters[key]

    // Each filter value should be an array
    if (!Array.isArray(value)) {
      valid = false
      return false
    }

    // Each item in the array should have label and value
    for (const item of value) {
      if (!item || typeof item !== 'object' || !('label' in item) || !('value' in item)) {
        valid = false
      }
    }
  }

  if (!valid) {
    console.log(filters)
    throw new Error('The filters that you applied were not correct.')
  }

  return true
}

export function getDefaultFromDate(extraDays = 0): any {
  const localMidnight = startOfLocalDay(sub(new Date(), { days: DEFAULT_FROM_DATE + extraDays }))
  const value = localMidnight.toISOString()
  return {
    date__gte: [{ label: value, value }],
  }
}

function getDefaultToDate(): any {
  const value = sub(new Date(), { minutes: DEFAULT_TO_DATE }).toISOString()
  return {
    date__lte: [{ label: '', value }],
  }
}

/** `{label,value}` entry for last_days. `0` is today. */
export function lastDaysFilter(days: number) {
  const n = Math.floor(days)
  const value = String(n)
  return [{ label: n === 0 ? 'Today' : `Last ${n} days`, value }]
}

function lastDaysHasValue(filters: any): boolean {
  const items = filters?.last_days
  if (!Array.isArray(items)) return false
  return items.some((item) => item != null && item.value !== '' && item.value != null)
}

export function appendDefaultDate(filters: any) {
  // Set From date to 2 days behind if there isn't a date query.
  // In case of a users or uids query, set the From date to 30 days behind.
  // last_days (including 0 / today) is an explicit window — do not inject date__gte.
  let result = { ...filters }
  const skipFromDefault = lastDaysHasValue(filters)

  if (filters && !('date__gte' in filters) && !('date__lte' in filters) && !skipFromDefault) {
    const filterKeys = Object.keys(filters)
    if (filterKeys.length === 1 && (filterKeys.includes('users') || filterKeys.includes('uids'))) {
      result = { ...result, ...getDefaultFromDate(28) }
    } else {
      result = { ...result, ...getDefaultFromDate() }
    }
  }

  if (filters && !('date__lte' in filters)) {
    result = { ...result, ...getDefaultToDate() }
  }

  return result
}

const EMPTY_DATE_GTE = [{ label: '', value: '' }]

/** Apply one filter-field edit. `last_days` and `date__gte` are mutually exclusive. */
export function applyFilterChange(filters: any, name: string, values?: any) {
  const next = { ...filters }

  if (name === 'date__gte' && values == null) {
    delete next.last_days
    return { ...next, date__gte: EMPTY_DATE_GTE }
  }

  if (values == null) {
    delete next[name]
    return next
  }

  if (name === 'last_days') {
    const raw = Array.isArray(values) ? values[0]?.value : values
    const days = Number(raw)
    if (!Number.isFinite(days) || days < 0) {
      delete next.last_days
      return next
    }
    delete next.date__gte
    next.last_days = lastDaysFilter(days)
    return next
  }

  if (name === 'date__gte') {
    delete next.last_days
  }

  next[name] = values
  return next
}

function getString(input: any): string {
  if (typeof input === 'object') {
    return JSON.stringify(input)
  }
  return String(input)
}

export function deserializeFiltersFromObject(apiFilters: Record<string, string>): any {
  const result: any = {}

  for (const k of Object.keys(apiFilters)) {
    const v = apiFilters[k]
    if (typeof v !== 'string' || !k) continue

    // Empty string should be converted to empty array with one empty item
    if (v === '') {
      result[k] = [{ label: '', value: '' }]
      continue
    }

    // If the value is a JSON object/array (e.g. geometry), keep it as-is.
    // Otherwise split comma-separated string values.
    let parsed: any
    try {
      parsed = JSON.parse(v)
    } catch {
      parsed = undefined
    }

    if (parsed !== undefined && typeof parsed === 'object') {
      result[k] = [{ label: parsed, value: parsed }]
    } else {
      result[k] = v.split(',').map((val) => ({
        label: val.trim(),
        value: val.trim(),
      }))
    }
  }

  return result
}

export function serializeFiltersToObject(filters: any): Record<string, string> {
  const result: Record<string, string> = {}

  for (const k of Object.keys(filters)) {
    const v = filters[k]
    if (!Array.isArray(v) || !k) continue

    const serialized = v
      .filter((x) => !!x && typeof x === 'object' && x.value !== '')
      .map((x) => getString(x.value))
      .join(',')

    if (serialized) {
      result[k] = serialized
    }
  }

  return result
}

export function serializeFiltersToQuery(filters: any): string {
  let query = ''

  for (const k of Object.keys(filters)) {
    const v = filters[k]
    if (!Array.isArray(v) || !k) continue

    const filterJoined = v
      .filter((x) => !!x && typeof x === 'object' && x.value !== '')
      .map((x) => getString(x.value))
      .join(',')

    if (filterJoined === '') continue
    query += `&${k}=${encodeURIComponent(filterJoined)}`
  }

  return query
}
