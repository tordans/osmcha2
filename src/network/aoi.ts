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

const aoiListResponseSchema = z.object({
  results: z.object({
    features: z.array(aoiFeatureSchema),
  }),
})

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
