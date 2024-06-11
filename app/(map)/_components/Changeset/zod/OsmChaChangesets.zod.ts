import { z } from 'zod'

export type TOsmChaChangesets = z.infer<typeof OsmChaChangesets>

const Coordinate = z.array(z.number())
const Polygon = z.strictObject({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(Coordinate)),
})

const IdNameObject = z.strictObject({ id: z.number(), name: z.string() })

const ReviewFeature = z.object({
  url: z.string(),
  osm_id: z.number(),
  reasons: z.array(z.number()),
  version: z.number(),
  primary_tags: z.record(z.unknown()),
})

const Properties = z.strictObject({
  // Review
  is_suspect: z.boolean(),
  checked: z.boolean(),
  check_user: z.nullable(z.string()),
  check_date: z.coerce.date().nullable(),
  harmful: z.boolean().nullable(),
  reasons: z.array(IdNameObject),
  features: z.array(ReviewFeature),
  reviewed_features: z.array(z.never()),

  // Modifications
  create: z.number(),
  modify: z.number(),
  delete: z.number(),

  // Meta
  uid: z.string(),
  user: z.string(),
  date: z.coerce.date(),
  area: z.number(),
  comment: z.string(),
  comments_count: z.number(),
  source: z.string(),
  editor: z.string(),
  imagery_used: z.string(),
  metadata: z.intersection(
    z.record(z.union([z.string(), z.number()])),
    z.object({
      locale: z.string().optional(),
    }),
  ),

  // Tags
  tags: z.array(IdNameObject),
  tag_changes: z.record(z.string(), z.array(z.string())),
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
