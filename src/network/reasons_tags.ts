import { z } from 'zod'
import { api } from './request.ts'

const reasonRowSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
})

const reasonListSchema = z.object({
  results: z.array(reasonRowSchema),
})

const tagRowSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  for_changeset: z.boolean().optional(),
  is_visible: z.boolean().optional(),
  trusted: z.boolean().optional(),
})

export const tagListSchema = z.object({
  results: z.array(tagRowSchema).optional(),
})

export function fetchReasons() {
  return api
    .get('/suspicion-reasons/?page_size=200')
    .then((data) => reasonListSchema.parse(data).results)
}
