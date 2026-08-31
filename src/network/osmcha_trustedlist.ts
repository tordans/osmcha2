import { z } from 'zod'
import { api } from './request.ts'

const whitelistUserSchema = z.object({
  whitelist_user: z.string(),
})

export function deleteFromTrustedList(username: string): Promise<void> {
  return api.delete(`/whitelist-user/${username}/`).then((data) => {
    z.undefined().parse(data)
  })
}

export function postUserToTrustedList(whitelist_user: string) {
  return api
    .post('/whitelist-user/', { whitelist_user })
    .then((data) => whitelistUserSchema.parse(data))
}
