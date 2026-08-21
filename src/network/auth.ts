import { z } from 'zod'
import { osmchaSocialTokenUrl } from '../config/constants.ts'
import { api, handleResponse } from './request.ts'

const oauthTokenSchema = z.object({ token: z.string().min(1) })
const authUrlSchema = z.object({ auth_url: z.string().min(1) })

const userDetailsSchema = z.object({
  username: z.string(),
  uid: z.union([z.string(), z.number(), z.null()]).optional(),
  id: z.union([z.string(), z.number()]).optional(),
  avatar: z.union([z.string(), z.null()]).optional(),
  is_staff: z.boolean().optional(),
  message_good: z.string().optional(),
  message_bad: z.string().optional(),
  comment_feature: z.boolean().optional(),
  whitelists: z.array(z.string()).optional(),
})

export type UserDetails = z.infer<typeof userDetailsSchema>

export async function postFinalTokensOSMCha(code: string) {
  const formData = new URLSearchParams()
  formData.append('code', code)

  try {
    const res = await fetch(osmchaSocialTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })
    const data = await handleResponse(res)
    return oauthTokenSchema.parse(data)
  } catch (e) {
    console.error(e)
    throw e
  }
}

export async function getAuthUrl() {
  return authUrlSchema.parse(await api.post('/social-auth/'))
}

export function fetchUserDetails(): Promise<UserDetails> {
  return api.get('/users/').then((data) => userDetailsSchema.parse(data))
}

export function updateUserDetails(
  message_good: string,
  message_bad: string,
  comment_feature: boolean,
) {
  return api.patch('/users/', {
    message_good,
    message_bad,
    comment_feature,
  })
}
