import { z } from 'zod'
import { whosThat } from '../config/constants.ts'
import { handleResponse } from './request.ts'

const whosthatUserSchema = z.object({
  names: z.array(z.string()).optional(),
})

const whosthatUsersSchema = z.array(whosthatUserSchema)

export async function getUsers(input: string | number) {
  const res = await fetch(`${whosThat}${input}`, { method: 'GET' })
  const json = await handleResponse(res)
  const parsed = whosthatUsersSchema.safeParse(json)
  return parsed.success ? parsed.data : []
}
