import { z } from 'zod'

export type PinParam = { lat: number; lng: number }

const coordSchema = z.string().min(1).pipe(z.coerce.number())

const PinParamSchema = z.tuple([
  coordSchema.pipe(z.number().min(-90).max(90)),
  coordSchema.pipe(z.number().min(-180).max(180)),
])

export const parsePinParam = (query: string): PinParam | null => {
  if (!query) return null
  const parsed = PinParamSchema.safeParse(query.split(','))
  if (!parsed.success) return null
  const [lat, lng] = parsed.data
  return { lat, lng }
}

export const serializePinParam = ({ lat, lng }: PinParam): string =>
  `${lat.toFixed(5)},${lng.toFixed(5)}`
