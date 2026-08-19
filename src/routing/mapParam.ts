import { z } from 'zod'

export type MapParam = { zoom: number; lat: number; lng: number }

const roundNumber = (number: number | string, precision?: number) => {
  if (typeof number === 'string') {
    return Number.parseFloat(Number.parseFloat(number).toFixed(precision))
  }
  return Number.parseFloat(number.toFixed(precision))
}

const roundByZoom = (number: number | string, zoom: number) => {
  const latLngPrecisionByZoom = zoom >= 17 ? 5 : zoom < 13 ? 3 : 4
  return roundNumber(number, latLngPrecisionByZoom)
}

export const roundPositionForURL = (lat: number, lng: number, zoom: number) => {
  lat = roundByZoom(lat, zoom)
  lng = roundByZoom(lng, zoom)
  zoom = roundNumber(zoom, 1)
  return [lat, lng, zoom] as const
}

const MapParamSchema = z.tuple([
  z.coerce.number().min(0).max(22),
  z.coerce.number().min(-90).max(90),
  z.coerce.number().min(-180).max(180),
])

export const parseMapParam = (query: string): MapParam | null => {
  if (!query) return null
  const parsed = MapParamSchema.safeParse(query.split('/'))
  if (!parsed.success) return null
  const [zoom, lat, lng] = parsed.data
  return { zoom, lat, lng }
}

export const serializeMapParam = ({ zoom, lat, lng }: MapParam) => {
  const [roundedLat, roundedLng, roundedZoom] = roundPositionForURL(lat, lng, zoom)
  return `${roundedZoom}/${roundedLat}/${roundedLng}`
}

/** Drop review map viewport when navigating to a different changeset id. */
export function searchWithoutMap<T extends object>(search: T): Omit<T, 'map'> {
  const { map: _map, ...rest } = search as T & { map?: string }
  return rest as Omit<T, 'map'>
}
