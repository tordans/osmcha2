import {
  createSearchParamsCache,
  parseAsJson,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server'
import { TParamFilters } from './ParamFilters.zod'
import { orderByOptions } from './ParamOrderBy.zod'

// Docs: https://github.com/47ng/nuqs?tab=readme-ov-file#accessing-searchparams-in-server-components

export const searchParamsCache = createSearchParamsCache({
  // List your search param keys and associated parsers here:
  selected: parseAsString,
  filters: parseAsJson<TParamFilters>().withDefault({}),
  aoi: parseAsString,
  orderBy: parseAsStringLiteral(orderByOptions.map((o) => o.value)),
  page: parseAsString.withDefault('1'),
  feature: parseAsString,
  // details: parseAsStringLiteral(['changes', 'comments']).withDefault('changes'), // Only in Details.tsx for now
})
