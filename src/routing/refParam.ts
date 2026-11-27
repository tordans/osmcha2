import { z } from 'zod'
import { osmElementTypeSchema, type OsmElementType } from '../utils/osmElement.ts'

export type RefParam = { type: OsmElementType; id: number; key?: string }

const osmIdSchema = z
  .string()
  .regex(/^\d+$/)
  .transform((value) => Number(value))
  .pipe(z.number().int().positive())

const RefParamSchema = z.object({
  type: osmElementTypeSchema,
  id: osmIdSchema,
  key: z.string().min(1).optional(),
})

export const parseRefParam = (query: string): RefParam | null => {
  if (!query) return null
  const typeEnd = query.indexOf('/')
  if (typeEnd < 0) return null
  const type = query.slice(0, typeEnd)
  const afterType = query.slice(typeEnd + 1)
  const idEnd = afterType.indexOf('/')
  const id = idEnd < 0 ? afterType : afterType.slice(0, idEnd)
  const key = idEnd < 0 ? undefined : afterType.slice(idEnd + 1)
  if (key === '') return null
  const parsed = RefParamSchema.safeParse({
    type,
    id,
    ...(key !== undefined ? { key } : {}),
  })
  if (!parsed.success) return null
  return parsed.data
}

export const serializeRefParam = ({ type, id, key }: RefParam): string =>
  key ? `${type}/${id}/${key}` : `${type}/${id}`
