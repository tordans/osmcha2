import { z } from 'zod'

const PropertyType = z.union([z.literal('node'), z.literal('way'), z.literal('relation')])

const PropertyShared = z.strictObject({
  id: z.string(),
  version: z.coerce.number(),
  timestamp: z.coerce.date(),
  changeset: z.string(),
  uid: z.string(),
  user: z.string(),
  type: PropertyType,
  tags: z.record(z.string()),
})
const PropertyModify = z.strictObject({
  action: z.literal('modify'),
  changeType: z.union([z.literal('modifiedNew'), z.literal('modifiedOld')]),
})
const PropertyDelete = z.strictObject({
  action: z.literal('delete'),
  changeType: z.literal('deleteNew'),
})
const PropertyCreate = z.strictObject({
  action: z.literal('create'),
  changeType: z.literal('added'),
})
const Properties = z.discriminatedUnion('action', [
  PropertyShared.merge(PropertyModify),
  PropertyShared.merge(PropertyDelete),
  PropertyShared.merge(PropertyCreate),
])

const GeometryPoint = z.strictObject({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]),
})
const GeometryLineString = z.strictObject({
  type: z.literal('LineString'),
  coordinates: z.array(z.tuple([z.number(), z.number()])),
})
const GeometryPolygon = z.strictObject({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
})
const Geometry = z.discriminatedUnion('type', [GeometryLineString, GeometryPoint, GeometryPolygon])

const Feature = z.strictObject({
  type: z.literal('Feature'),
  properties: Properties,
  geometry: Geometry,
})

export type TOsmChaRealChangesetGeojson = z.infer<typeof OsmChaRealChangesetGeojson>

export const OsmChaRealChangesetGeojson = z.strictObject({
  type: z.literal('FeatureCollection'),
  features: z.array(Feature),
})
