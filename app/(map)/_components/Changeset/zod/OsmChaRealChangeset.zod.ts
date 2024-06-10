import { z } from 'zod'

const WayNotes = z.strictObject({
  ref: z.string(),
  lat: z.string(),
  lon: z.string(),
})

// NOTE: Zod does not allow nested discriminatedUnions https://github.com/colinhacks/zod/issues/1884
// Otherwise we could refactor this: `action:"delete"` never had `old` but always has `visible`.
const Action = z.union([z.literal('modify'), z.literal('create'), z.literal('delete')])
const ElementShared = z.strictObject({
  id: z.string(),
  version: z.string(),
  visible: z.literal('false').optional(), // Note: Only for `action:"delete", but required then
  timestamp: z.string(),
  changeset: z.string(),
  uid: z.string(),
  user: z.string(),
  action: Action,
  tags: z.record(z.string()),
})
const ElementNode = z.strictObject({ type: z.literal('node'), lat: z.string(), lon: z.string() })
const ElementWay = z.strictObject({ type: z.literal('way'), nodes: z.array(WayNotes) })
const ElementRelation = z.strictObject({ type: z.literal('relation') })
const Element = z.discriminatedUnion('type', [
  ElementShared.merge(ElementNode),
  ElementShared.merge(ElementWay),
  ElementShared.merge(ElementRelation),
])
const ElementSharedWithOld =
  // Note: Only for `action:"modify"|"delete", but required then
  ElementShared.merge(z.strictObject({ old: Element.optional() }))
const ElementWithOld = z.discriminatedUnion('type', [
  ElementSharedWithOld.merge(ElementNode),
  ElementSharedWithOld.merge(ElementWay),
  ElementSharedWithOld.merge(ElementRelation),
])

const MetadataShared = z.strictObject({
  id: z.string(),
  created_at: z.string(),
  user: z.string(),
  uid: z.string(),
  min_lat: z.string(),
  min_lon: z.string(),
  max_lat: z.string(),
  max_lon: z.string(),
  comments_count: z.string(),
  changes_count: z.string(),
  tag: z.array(z.strictObject({ k: z.string(), v: z.string() })),
  bbox: z.strictObject({
    left: z.string(),
    bottom: z.string(),
    right: z.string(),
    top: z.string(),
  }),
  incomplete: z.literal(true).optional(), // NOTE: No idea what that means. It is not mentioned in osmcha-frontend, changeset-map, osm-adiff-parser, planet-stream, wiki/Overpass_API/Augmented_Diffs
})
const Metadata = z.discriminatedUnion('open', [
  MetadataShared.merge(z.strictObject({ open: z.literal('true') })),
  MetadataShared.merge(z.strictObject({ open: z.literal('false'), closed_at: z.string() })),
])

export type TOsmChaRealChangeset = z.infer<typeof OsmChaRealChangeset>

export const OsmChaRealChangeset = z.strictObject({
  elements: z.array(ElementWithOld),
  metadata: Metadata,
})
