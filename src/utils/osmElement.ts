import { z } from 'zod'

export const OSM_ELEMENT_TYPES = ['node', 'way', 'relation'] as const

export type OsmElementType = (typeof OSM_ELEMENT_TYPES)[number]

export const osmElementTypeSchema = z.enum(OSM_ELEMENT_TYPES)

export function isOsmElementType(value: string): value is OsmElementType {
  return osmElementTypeSchema.safeParse(value).success
}

/** `type/id`, the key of one OSM element (also the path on osm.org). */
export function objectRefKey(type: string, id: number | string): string {
  return `${type}/${id}`
}
