import { z } from 'zod'

const User = z.object({
  id: z.number(),
  display_name: z.string(),
  account_created: z.coerce.date(),
  description: z.string(),
  contributor_terms: z.object({
    agreed: z.boolean(),
  }),
  roles: z.array(z.string()),
  changesets: z.object({
    count: z.number(),
  }),
  traces: z.object({
    count: z.number(),
  }),
  blocks: z.object({
    received: z.object({
      count: z.number(),
      active: z.number(),
    }),
  }),
})

export type TOsmOrgUser = z.infer<typeof OsmOrgUser>

export const OsmOrgUser = z.object({
  version: z.string(),
  generator: z.string(),
  copyright: z.string(),
  attribution: z.string(),
  license: z.string(),
  user: User,
})
