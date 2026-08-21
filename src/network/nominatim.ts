import { z } from 'zod'
import { nominatimUrl } from '../config/constants.ts'
import { handleResponse } from './request.ts'

const nominatimPlaceSchema = z.object({
  display_name: z.string(),
  geojson: z.unknown().optional(),
})

const nominatimSearchResultSchema = z.array(nominatimPlaceSchema)

export type NominatimPlace = z.infer<typeof nominatimPlaceSchema>

export async function nominatimSearch(input: string, type: string): Promise<NominatimPlace[]> {
  const res = await fetch(`${nominatimUrl}?polygon_geojson=1&format=json&${type}=${input}`, {
    method: 'GET',
  })
  const json = await handleResponse(res)
  const parsed = nominatimSearchResultSchema.safeParse(json)
  return parsed.success ? parsed.data : []
}
