import { z } from 'zod'
import type { Filters } from '../components/filters/index.ts'

export const osmchaSearchSchema = z
  .object({
    aoi: z.string().optional(),
    page: z.coerce.number().int().positive().default(1).catch(1),
    token: z.string().optional(),
    map: z.string().optional(),
    /** Legacy blob `?filters={…}` — redirected to top-level filter params. */
    filters: z.unknown().optional(),
  })
  .catchall(z.unknown())

export type OsmchaSearch = z.infer<typeof osmchaSearchSchema>

/** Stable empty object for “no filters in the URL” — never allocate `{}` during render. */
export const EMPTY_FILTERS: Filters = {}

export const searchParamsRegistry = ['aoi', 'page', 'token', 'map'] as const

export type SearchParamKey = (typeof searchParamsRegistry)[number]
