import { z } from 'zod'

export type TOsmChaUser = z.infer<typeof OsmChaUser>

export const OsmChaUser = z.object({
  changesets_in_osmcha: z.number(),
  checked_changesets: z.number(),
  harmful_changesets: z.number(),
})
