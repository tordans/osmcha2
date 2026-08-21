import { z } from 'zod'
import { statusUrl } from '../config/constants.ts'
import { handleResponse } from './request.ts'

const osmchaStatusSchema = z.object({
  status: z.string(),
  message: z.string().optional(),
})

export async function getStatus() {
  const res = await fetch(statusUrl, { method: 'GET' })
  const data = await handleResponse(res)
  return osmchaStatusSchema.parse(data)
}
