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
    /** Note pin: `lat,lng` at five decimals. */
    pin: z.string().optional(),
    /** Map layers: comma-separated tokens; omit when every changeset layer is on, spyglass is on, and both seen and unseen are shown. */
    layers: z.string().optional(),
    /** List sort: `order=date,desc` (field,direction). */
    order: z.string().optional(),
    /** OSM OAuth callback (must not be treated as changeset filters). */
    code: z.string().optional(),
    state: z.string().optional(),
    /** Legacy blob `?filters={…}` — redirected to top-level filter params. */
    filters: z.unknown().optional(),
  })
  .catchall(z.unknown())

export type OsmchaSearch = z.infer<typeof osmchaSearchSchema>

/** Stable empty object for “no filters in the URL” — never allocate `{}` during render. */
export const EMPTY_FILTERS: Filters = {}

export const searchParamsRegistry = [
  'aoi',
  'page',
  'token',
  'map',
  'order',
  'ref',
  'pin',
  'layers',
] as const

/** OSM OAuth callback query keys — chrome, not changeset filters. */
export const oauthSearchKeys = ['code', 'state'] as const

export function withoutOAuthCallbackSearch<T extends Record<string, unknown>>(
  search: T,
): Omit<T, 'code' | 'state'> {
  const { code: _code, state: _state, ...rest } = search
  return rest
}

export type SearchParamKey = (typeof searchParamsRegistry)[number]
