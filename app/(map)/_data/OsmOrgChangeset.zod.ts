import { z } from 'zod'

const Discussion = z.strictObject({
  id: z.number(),
  date: z.coerce.date(),
  uid: z.number(),
  user: z.string(),
  text: z.string(),
})

const Element = z.strictObject({
  type: z.string(),
  id: z.number(),
  created_at: z.string(),
  closed_at: z.string(),
  open: z.boolean(),
  user: z.string(),
  uid: z.number(),
  minlat: z.number(),
  minlon: z.number(),
  maxlat: z.number(),
  maxlon: z.number(),
  comments_count: z.number(),
  changes_count: z.number(),
  tags: z.record(z.string()),
  discussion: z.array(Discussion).optional(),
})

export type TOsmOrgChangeset = z.infer<typeof OsmOrgChangeset>

export const OsmOrgChangeset = z.strictObject({
  version: z.string(),
  generator: z.string(),
  copyright: z.string(),
  attribution: z.string(),
  license: z.string(),
  elements: z.array(Element),
})
