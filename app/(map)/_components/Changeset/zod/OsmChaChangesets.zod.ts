import { z } from 'zod'

export type TOsmChaChangesets = z.infer<typeof OsmChaChangesets>

const Coordinate = z.array(z.number())
const Polygon = z.strictObject({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(Coordinate)),
})

const Properties = z.strictObject({
  area: z.number(),
  check_date: z.coerce.date().nullable(),
  check_user: z.nullable(z.string()),
  checked: z.boolean(),
  comment: z.string(),
  comments_count: z.number(),
  create: z.number(),
  date: z.string(),
  delete: z.number(),
  editor: z.string(),
  features: z.array(z.unknown()),
  harmful: z.boolean(),
  imagery_used: z.string(),
  is_suspect: z.boolean(),
  metadata: z.record(z.string(), z.union([z.string(), z.number()])),
  modify: z.number(),
  reasons: z.array(z.unknown()),
  reviewed_features: z.array(z.unknown()),
  source: z.string(),
  tag_changes: z.record(z.string(), z.array(z.string())),
  tags: z.array(z.strictObject({ id: z.number(), name: z.string() })),
  uid: z.string(),
  user: z.string(),
})

const Feature = z.strictObject({
  id: z.number(),
  type: z.literal('Feature'),
  geometry: Polygon,
  properties: Properties,
})

export const OsmChaChangesets = z.strictObject({
  type: z.literal('FeatureCollection'),
  count: z.coerce.number(),
  next: z.string().url().nullable(),
  previous: z.string().url().nullable(),
  features: z.array(Feature),
})
