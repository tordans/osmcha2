import type { Filters } from '../components/filters/filterTypes.ts'
import { deserializeFiltersFromObject, filtersSchema } from '../utils/filters.ts'
import { apiOrderFromUnknown, apiOrderToSearchParam, searchParamToApiOrder } from './orderParam.ts'
import { searchParamsRegistry, type OsmchaSearch } from './searchSchemas.ts'

const chromeKeySet = new Set<string>([...searchParamsRegistry, 'filters', 'order_by'])

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
    if (key === 'order_by') {
      const apiValue = apiOrderFromUnknown(items)
      const order = apiValue ? apiOrderToSearchParam(apiValue) : undefined
      if (order) result.order = order
      continue
    }
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

  const fromBlob = parseLegacyFiltersBlob(search.filters)
  if (fromBlob) return fromBlob

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

  const result = { ...deserializeFiltersFromObject(strings), ...objects }
  const orderApi = searchParamToApiOrder(search.order)
  if (orderApi) {
    result.order_by = [{ label: orderApi, value: orderApi }]
  }
  return result
}

type SearchLike = Record<string, unknown>

export function stripFilterSearch(search: SearchLike): OsmchaSearch {
  const next: Record<string, unknown> = {}
  for (const key of searchParamsRegistry) {
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
  let next: OsmchaSearch = { ...search }
  let changed = false

  const withoutOrderBy = migrateOrderBySearch(next)
  if (withoutOrderBy) {
    next = withoutOrderBy
    changed = true
  }

  const legacy = parseLegacyFiltersBlob(next.filters)
  if (legacy) {
    next = withFilters(next, legacy)
    changed = true
  } else if (next.filters != null) {
    const { filters: _unused, ...rest } = next
    next = rest as OsmchaSearch
    changed = true
  }

  if (isAccountPath(pathname) && hasFilterSearchParams(next)) {
    return { pathname: '/', search: next }
  }

  return changed ? { pathname, search: next } : null
}

/** `order_by=-date` (Django / old OSMCha) → `order=date,desc`. */
function migrateOrderBySearch(search: OsmchaSearch): OsmchaSearch | null {
  const raw = search as Record<string, unknown>
  if (!('order_by' in raw) || raw.order_by == null) return null
  const { order_by: orderBy, ...rest } = raw
  const apiValue = apiOrderFromUnknown(orderBy)
  const order = apiValue ? apiOrderToSearchParam(apiValue) : undefined
  const next = rest as OsmchaSearch
  if (order && next.order == null) next.order = order
  return next
}

function parseLegacyFiltersBlob(raw: unknown): Filters | null {
  if (raw == null) return null
  let candidate: unknown = raw
  if (typeof raw === 'string') {
    try {
      candidate = JSON.parse(raw) as unknown
    } catch {
      return null
    }
  }
  const result = filtersSchema.safeParse(candidate)
  return result.success ? (result.data as Filters) : null
}
