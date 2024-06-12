import { z } from 'zod'

export type TOsmChaChangeset = z.infer<typeof OsmChaChangeset>
export type TOsmChaChangesetProperties = z.infer<typeof OsmChaChangeset>['properties']

export const OsmChaChangeset = z.object({
  id: z.number(),
  type: z.literal('Feature'),
  geometry: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.array(z.number()))),
  }),
  properties: z.object({
    check_user: z.string().nullable(),
    reasons: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
      }),
    ),
    tags: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
      }),
    ),
    features: z.array(z.record(z.union([z.string(), z.number()]))),
    user: z.string(),
    uid: z.string(),
    editor: z.string(),
    comment: z.string(),
    comments_count: z.number(),
    source: z.string(),
    imagery_used: z.string(),
    date: z.coerce.date(),
    reviewed_features: z.array(z.record(z.union([z.string(), z.number()]))),
    tag_changes: z.record(z.array(z.string())),
    create: z.number(),
    modify: z.number(),
    delete: z.number(),
    area: z.number(),
    is_suspect: z.boolean(),
    harmful: z.boolean().nullable(),
    checked: z.boolean(),
    check_date: z.coerce.date().nullable(),
    metadata: z.object({
      host: z.string().optional(),
      changesets_count: z.number().optional(),
    }),
  }),
})
