import { z } from 'zod'
import { OsmChaAoi } from './OsmChaAoi.zod'

export type TOsmChaAois = z.infer<typeof OsmChaAois>

export const OsmChaAois = z.strictObject({
  count: z.number(),
  next: z.string().url().nullish(),
  previous: z.string().url().nullish(),
  results: z.strictObject({
    type: z.literal('FeatureCollection'),
    features: z.array(OsmChaAoi),
  }),
})
