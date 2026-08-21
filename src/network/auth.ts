import { z } from 'zod'
import { osmchaSocialTokenUrl } from '../config/constants.ts'
import { api, handleResponse } from './request.ts'

const oauthTokenSchema = z.object({ token: z.string().min(1) })
const authUrlSchema = z.object({ auth_url: z.string().min(1) })

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

export function fetchUserDetails() {
  return api.get('/users/')
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
