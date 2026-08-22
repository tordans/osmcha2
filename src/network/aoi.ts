import { z } from 'zod'
import { serializeFiltersToObject } from '../utils/filters.ts'
import { api } from './request.ts'

const aoiPropertiesSchema = z.object({
  name: z.string().optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
})

const aoiFeatureSchema = z.object({
  id: z.union([z.string(), z.number()]),
  properties: aoiPropertiesSchema.optional(),
})

export type AoiFeature = z.infer<typeof aoiFeatureSchema>

const aoiFeatureListSchema = z.array(aoiFeatureSchema)

const aoiFeatureCollectionSchema = z.object({
  features: aoiFeatureListSchema,
})

const aoiListResponseSchema = z.object({
  results: aoiFeatureCollectionSchema,
})

/** Normalize API, GeoJSON, or persisted query-cache shapes to a feature list. */
export function aoiListFromQueryData(data: unknown): AoiFeature[] {
  const asList = aoiFeatureListSchema.safeParse(data)
  if (asList.success) return asList.data

  const asCollection = aoiFeatureCollectionSchema.safeParse(data)
  if (asCollection.success) return asCollection.data.features

  const asApi = aoiListResponseSchema.safeParse(data)
  if (asApi.success) return asApi.data.results.features

  return []
}

export function createAOI(name: string, filters: any): Promise<AoiFeature> {
  return api
    .post('/aoi/', {
      name,
      filters: serializeFiltersToObject(filters),
    })
    .then((data) => aoiFeatureSchema.parse(data))
}

export function fetchAOI(aoiId: string): Promise<AoiFeature> {
  return api.get(`/aoi/${aoiId}/`).then((data) => aoiFeatureSchema.parse(data))
}

export function fetchAllAOIs(): Promise<AoiFeature[]> {
  return api.get('/aoi/').then((data) => aoiListResponseSchema.parse(data).results.features)
}

export function updateAOI(aoiId: string, name: string, filters: any): Promise<AoiFeature> {
  return api
    .put(`/aoi/${aoiId}/`, {
      name,
      filters: serializeFiltersToObject(filters),
    })
    .then((data) => aoiFeatureSchema.parse(data))
}

export function deleteAOI(aoiId: string): Promise<void> {
  return api.delete(`/aoi/${aoiId}/`)
}
