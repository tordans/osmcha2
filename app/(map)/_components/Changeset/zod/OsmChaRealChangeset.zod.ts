import { z } from 'zod'

const Node = z.object({
  ref: z.string(),
  lat: z.string(),
  lon: z.string(),
})

const Action = z.union([z.literal('modify'), z.literal('create'), z.literal('delete')])
const Type = z.union([z.literal('node'), z.literal('way'), z.literal('relation')])

const Element = z.object({
  id: z.string(),
  version: z.string(),
  timestamp: z.string(),
  changeset: z.string(),
  uid: z.string(),
  user: z.string(),
  old: z
    .object({
      id: z.string(),
      version: z.string(),
      timestamp: z.string(),
      changeset: z.string(),
      uid: z.string(),
      user: z.string(),
      action: Action,
      type: Type,
      tags: z.record(z.string()),
      nodes: z.array(Node).optional(),
    })
    .optional(),
  action: Action,
  type: Type,
  tags: z.record(z.string()),
  nodes: z.array(Node).optional(),
})

const Metadata = z.object({
  id: z.string(),
  created_at: z.string(),
  closed_at: z.string(),
  open: z.string(),
  user: z.string(),
  uid: z.string(),
  min_lat: z.string(),
  min_lon: z.string(),
  max_lat: z.string(),
  max_lon: z.string(),
  comments_count: z.string(),
  changes_count: z.string(),
  tag: z.array(
    z.object({
      k: z.string(),
      v: z.string(),
    }),
  ),
  bbox: z.object({
    left: z.string(),
    bottom: z.string(),
    right: z.string(),
    top: z.string(),
  }),
})

export type TOsmChaRealChangeset = z.infer<typeof OsmChaRealChangeset>

export const OsmChaRealChangeset = z.object({
  elements: z.array(Element),
  metadata: Metadata,
})
