import { z } from 'zod'

const filtersSchema = z
  .record(z.string(), z.unknown())
  .optional()
  .transform((value) => {
    if (!value || Object.keys(value).length === 0) return undefined
    return value
  })
  .catch(undefined)

export const osmchaSearchSchema = z.object({
  filters: filtersSchema,
  aoi: z.string().optional(),
  token: z.string().optional(),
  page: z.coerce.number().int().positive().default(1).catch(1),
})

export type OsmchaSearch = z.infer<typeof osmchaSearchSchema>

export const searchParamsRegistry = ['filters', 'aoi', 'page', 'token', 'map'] as const

export type SearchParamKey = (typeof searchParamsRegistry)[number]
