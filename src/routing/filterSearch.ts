import type { Filters } from '../components/filters/index.ts'
import { deserializeFiltersFromObject } from '../utils/filters.ts'
import type { OsmchaSearch } from './searchSchemas.ts'

const CHROME_SEARCH_KEYS = ['aoi', 'page', 'token', 'map'] as const

const chromeKeySet = new Set<string>([...CHROME_SEARCH_KEYS, 'filters'])

function isFilterSearchKey(key: string) {
  return !chromeKeySet.has(key)
}

function hasFilterSearchParams(search: OsmchaSearch) {
  if (search.filters != null) return true
  return Object.keys(search).some(isFilterSearchKey)
}

export function isAccountPath(pathname: string) {
  return (
    pathname === '/user' ||
    pathname === '/teams' ||
    pathname.startsWith('/teams/') ||
    pathname === '/trusted-users' ||
    pathname === '/watchlist' ||
    pathname === '/saved-filters' ||
    pathname === '/authorized'
  )
}

function filterParamToString(value: unknown): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

export function serializeFiltersToSearch(filters: Filters): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, items] of Object.entries(filters)) {
    if (!Array.isArray(items) || !key) continue
    const nonempty = items.filter((item) => item && typeof item === 'object' && item.value !== '')
    if (nonempty.length === 0) {
      if (key === 'date__gte' && items.some((item) => item && item.value === '')) {
        result[key] = ''
      }
      continue
    }
    const values = nonempty.map((item) => item.value)
    if (values.some((value) => typeof value === 'object')) {
      result[key] = values.length === 1 ? values[0] : values
    } else {
      result[key] = nonempty
        .map((item) => filterParamToString(item.value))
        .filter((value): value is string => value != null)
        .join(',')
    }
  }

  return result
}

export function filtersFromSearch(search: OsmchaSearch): Filters {
  const strings: Record<string, string> = {}
  const objects: Filters = {}

  if (search.filters && typeof search.filters === 'object' && !Array.isArray(search.filters)) {
    return search.filters as Filters
  }

  for (const [key, value] of Object.entries(search)) {
    if (!isFilterSearchKey(key) || value == null) continue
    if (typeof value === 'object') {
      objects[key] = [{ label: value, value }]
      continue
    }
    const asString = filterParamToString(value)
    if (asString == null) continue
    strings[key] = asString
  }

  return { ...deserializeFiltersFromObject(strings), ...objects }
}

type SearchLike = Record<string, unknown>

export function stripFilterSearch(search: SearchLike): OsmchaSearch {
  const next: Record<string, unknown> = {}
  for (const key of CHROME_SEARCH_KEYS) {
    if (search[key] != null) next[key] = search[key]
  }
  return next as OsmchaSearch
}

export function withFilters(search: SearchLike, filters: Filters | undefined): OsmchaSearch {
  const next = stripFilterSearch(search)
  if (filters && Object.keys(filters).length > 0) {
    Object.assign(next, serializeFiltersToSearch(filters))
  }
  return next
}

export function listSearchFromFilters(filters: Filters): OsmchaSearch {
  return withFilters({}, filters)
}

/** Flatten `?filters={…}` and move list filters off account pages. */
export function migrateLegacyFilterSearch(
  pathname: string,
  search: OsmchaSearch,
): { pathname: string; search: OsmchaSearch } | null {
  const legacy = parseLegacyFiltersBlob(search.filters)
  let next: OsmchaSearch = { ...search }
  let changed = false

  if (legacy) {
    next = withFilters(search, legacy)
    changed = true
  } else if (search.filters != null) {
    const { filters: _unused, ...rest } = next
    next = rest as OsmchaSearch
    changed = true
  }

  if (isAccountPath(pathname) && hasFilterSearchParams(next)) {
    return { pathname: '/', search: next }
  }

  return changed ? { pathname, search: next } : null
}

function parseLegacyFiltersBlob(raw: unknown): Filters | null {
  if (raw == null) return null
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Filters
      }
    } catch {
      return null
    }
    return null
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Filters
  }
  return null
}
