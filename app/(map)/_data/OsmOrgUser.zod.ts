import { z } from 'zod'

const User = z.strictObject({
  id: z.number(),
  display_name: z.string(),
  account_created: z.coerce.date(),
  description: z.string(),
  contributor_terms: z.strictObject({
    agreed: z.boolean(),
  }),
  img: z
    .strictObject({
      href: z.string().url(),
    })
    .optional(),
  roles: z.array(z.string()),
  changesets: z.strictObject({
    count: z.number(),
  }),
  traces: z.strictObject({
    count: z.number(),
  }),
  blocks: z.strictObject({
    received: z.strictObject({
      count: z.number(),
      active: z.number(),
    }),
  }),
})

export type TOsmOrgUser = z.infer<typeof OsmOrgUser>

export const OsmOrgUser = z.strictObject({
  version: z.literal('0.6'),
  generator: z.literal('OpenStreetMap server'),
  copyright: z.literal('OpenStreetMap and contributors'),
  attribution: z.literal('http://www.openstreetmap.org/copyright'),
  license: z.literal('http://opendatacommons.org/licenses/odbl/1-0/'),
  user: User,
})
