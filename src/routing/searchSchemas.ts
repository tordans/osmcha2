import { z } from 'zod'
import type { Filters } from '../components/filters/filterTypes.ts'

/**
 * Optional string param. The router parses `?ref=123` to a number, so numbers become strings; null,
 * booleans and arrays (duplicated keys) are dropped instead of failing validation or turning into
 * strings like "null" or "a,b".
 */
const looseString = z
  .preprocess((value) => (typeof value === 'number' ? String(value) : value), z.string())
  .optional()
  .catch(undefined)

export const osmchaSearchSchema = z
  .object({
    /** Saved-filter id (UUID); it goes into API paths, so anything else is dropped. Coerced because the router parses digits to a number. */
    aoi: z.coerce
      .string()
      .regex(/^[\w-]+$/)
      .optional()
      .catch(undefined),
    page: z.coerce.number().int().positive().default(1).catch(1),
    token: looseString,
    map: looseString,
    /** Object/tag address: `way/123` or `way/123/highway`. */
    ref: looseString,
    /**
     * Size of the "Same tag changes" group a note is about; only read from posted links. The router
     * parses `group=2` as a number, so it is turned back into a string.
     */
    group: looseString,
    /** Note pin: `lat,lng` at five decimals. */
    pin: looseString,
    /** Map layers: comma-separated tokens; omit at the default layers (Unchanged off) + spyglass + Unseen review filter. Seen-only adds `no-unseen`. */
    layers: looseString,
    /** List sort: `order=date,desc` (field,direction). */
    order: looseString,
    code: looseString,
    state: looseString,
    /** Legacy blob `?filters={...}`, redirected to top-level filter params. */
    filters: z.unknown().optional(),
  })
  .catchall(z.unknown())

export type OsmchaSearch = z.infer<typeof osmchaSearchSchema>

/** Stable empty object for "no filters in the URL". Never allocate `{}` during render. */
export const EMPTY_FILTERS: Filters = {}

export const searchParamsRegistry = [
  'aoi',
  'page',
  'token',
  'map',
  'order',
  'ref',
  'group',
  'pin',
  'layers',
] as const

/** OSM OAuth callback query keys. Chrome, not changeset filters. */
export const oauthSearchKeys = ['code', 'state'] as const

export function withoutOAuthCallbackSearch<T extends Record<string, unknown>>(
  search: T,
): Omit<T, 'code' | 'state'> {
  const { code: _code, state: _state, ...rest } = search
  return rest
}

export type SearchParamKey = (typeof searchParamsRegistry)[number]
