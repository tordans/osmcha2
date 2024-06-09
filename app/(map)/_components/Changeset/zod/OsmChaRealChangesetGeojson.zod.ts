import { z } from 'zod'

const PropertyType = z.union([z.literal('node'), z.literal('way'), z.literal('relation')])

const PropertyModify = z.object({
  action: z.literal('modify'),
  changeType: z.literal('modifyNew'),
})
const PropertyDelete = z.object({
  action: z.literal('delete'),
  changeType: z.literal('deleteNew'),
})
const PropertyCreate = z.object({
  action: z.literal('create'),
  changeType: z.literal('added'),
})

const Properties = z.union([
  PropertyModify,
  PropertyDelete,
  PropertyCreate,
  z.object({
    id: z.string(),
    version: z.coerce.number(),
    timestamp: z.string().datetime(),
    changeset: z.string(),
    uid: z.string(),
    user: z.string(),
    type: PropertyType,
    tags: z.record(z.string()),
  }),
])

const GeometryPoint = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]),
})
const GeometryLineString = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(z.tuple([z.number(), z.number()])),
})
const GeometryPolygon = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
})
const Geometry = z.union([GeometryLineString, GeometryPoint, GeometryPolygon])

const Feature = z.object({
  type: z.literal('Feature'),
  properties: Properties,
  geometry: Geometry,
})

export type TOsmChaRealChangesetGeojson = z.infer<typeof OsmChaRealChangesetGeojson>

export const OsmChaRealChangesetGeojson = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(Feature),
})
