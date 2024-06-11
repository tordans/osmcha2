import { z } from 'zod'

export type TOsmChaChangesets = z.infer<typeof OsmChaChangesets>

const Coordinate = z.array(z.number())
const Polygon = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(Coordinate)),
})

const Properties = z.object({
  check_user: z.nullable(z.string()),
  reasons: z.array(z.unknown()),
  tags: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
    }),
  ),
  features: z.array(z.unknown()),
  user: z.string(),
  uid: z.string(),
  editor: z.string(),
  comment: z.string(),
  comments_count: z.number(),
  source: z.string(),
  imagery_used: z.string(),
  date: z.string(),
  reviewed_features: z.array(z.unknown()),
  checked: z.boolean(),
  check_date: z.coerce.date().nullable(),
})

const Feature = z.object({
  id: z.number(),
  type: z.literal('Feature'),
  geometry: Polygon,
  properties: Properties,
})

export const OsmChaChangesets = z.object({
  type: z.literal('FeatureCollection'),
  count: z.coerce.number(),
  next: z.string().url().nullable(),
  previous: z.string().url().nullable(),
  features: z.array(Feature),
})
