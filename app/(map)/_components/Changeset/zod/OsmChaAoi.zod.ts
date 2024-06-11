import { z } from 'zod'

export type TOsmChaAoi = z.infer<typeof OsmChaAoi>

export const OsmChaAoi = z.strictObject({
  id: z.string(),
  type: z.literal('Feature'),
  geometry: z.strictObject({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
  }),
  properties: z.strictObject({
    name: z.string(),
    filters: z.strictObject({
      area_lt: z.string(),
      geometry: z.string(),
      date__gte: z.string(),
      tag_changes: z.string(),
    }),
    date: z.string(),
    changesets_url: z.string(),
  }),
})
