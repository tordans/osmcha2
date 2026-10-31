import { z } from 'zod'
import type { Filters } from '../components/filters/filterTypes.ts'

export const osmchaSearchSchema = z
  .object({
    aoi: z.string().optional(),
    page: z.coerce.number().int().positive().default(1).catch(1),
    token: z.string().optional(),
    map: z.string().optional(),
    /** Object/tag address: `way/123` or `way/123/highway`. */
    ref: z.string().optional(),
    /**
     * Size of the "Same tag changes" group a note is about; only read from posted links. The router
     * parses `group=2` as a number, so it is coerced back to a string.
     */
    group: z.coerce.string().optional().catch(undefined),
    /** Note pin: `lat,lng` at five decimals. */
    pin: z.string().optional(),
    /** Map layers: comma-separated tokens; omit at the default layers (Unchanged off) + spyglass + Unseen review filter. Seen-only adds `no-unseen`. */
    layers: z.string().optional(),
    /** List sort: `order=date,desc` (field,direction). */
    order: z.string().optional(),
    code: z.string().optional(),
    state: z.string().optional(),
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
