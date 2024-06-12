import { z } from 'zod'

export type TOsmChaAoi = z.infer<typeof OsmChaAoi>

const Polygon = z.strictObject({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
})
const MultiPolygon = z.strictObject({
  type: z.literal('MultiPolygon'),
  coordinates: z.array(z.array(z.array(z.tuple([z.number(), z.number()])))),
})

export const OsmChaAoi = z.strictObject({
  id: z.string(),
  type: z.literal('Feature'),
  geometry: z.discriminatedUnion('type', [Polygon, MultiPolygon]).nullable(),
  properties: z.strictObject({
    name: z.string(),
    filters: z.strictObject({
      area_lt: z.string().optional(),
      geometry: z.string().optional(),
      date__gte: z.string().optional(),
      date__lte: z.string().optional(),
      tag_changes: z.string().optional(),
      harmful: z.string().optional(),
      checked: z.string().optional(),
      reasons: z.string().optional(),
      tags: z.string().optional(),
      users: z.string().optional(),
      editor: z.string().optional(),
      comment: z.string().optional(),
      in_bbox: z.string().optional(),
    }),
    date: z.coerce.date(), // createdAt, it looks like there is no updatedAt
    changesets_url: z.string(),
  }),
})
