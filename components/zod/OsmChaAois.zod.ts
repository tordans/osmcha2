import { z } from 'zod'
import { OsmChaAoi } from './OsmChaAoi.zod'

export type TOsmChaAois = z.infer<typeof OsmChaAois>

export const OsmChaAois = z.strictObject({
  count: z.number(),
  next: z.string().url().optional(),
  previous: z.string().url().optional(),
  results: z.strictObject({
    type: z.literal('FeatureCollection'),
    features: z.array(OsmChaAoi),
  }),
})
