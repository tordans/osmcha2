import { z } from 'zod'
import { apiOSM } from '../config/constants.ts'
import { api, handleResponse } from './request.ts'

const osmChangesetCommentSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  user: z.string().optional(),
  date: z.string().optional(),
  text: z.string().optional(),
})

export const osmChangesetPayloadSchema = z.object({
  changeset: z.object({
    open: z.boolean().optional(),
    created_at: z.string().optional(),
    closed_at: z.string().nullable().optional(),
    min_lon: z.number().optional(),
    min_lat: z.number().optional(),
    max_lon: z.number().optional(),
    max_lat: z.number().optional(),
    comments: z.array(osmChangesetCommentSchema).optional(),
  }),
})

export type OsmChangesetPayload = z.infer<typeof osmChangesetPayloadSchema>

const osmUserPayloadSchema = z.object({
  user: z.object({
    display_name: z.string(),
    account_created: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    img: z.object({ href: z.string().optional() }).nullable().optional(),
    changesets: z.object({ count: z.number() }).nullable().optional(),
  }),
})

const osmchaUserStatsSchema = z.object({
  changesets_in_osmcha: z.number().optional(),
  checked_changesets: z.number().optional(),
  harmful_changesets: z.number().optional(),
})

export async function fetchChangesetMetadata(id: number): Promise<OsmChangesetPayload> {
  const res = await fetch(`${apiOSM}/changeset/${id}.json?include_discussion=true`)
  const metadata = await handleResponse(res)
  return osmChangesetPayloadSchema.parse(metadata)
}

export function getUserDetails(uid: number) {
  const user: { uid: number } = { uid }

  const fromOSM = fetch(`${apiOSM}/user/${uid}.json`)
    .then((r) => r.json())
    .then((r) => {
      const parsed = osmUserPayloadSchema.safeParse(r)
      if (!parsed.success) return user

      const u = parsed.data.user
      return {
        uid,
        count: u.changesets?.count ?? undefined,
        accountCreated: u.account_created ?? undefined,
        description: u.description ?? undefined,
        img: u.img?.href,
        name: u.display_name,
      }
    })
    .catch(() => user)

  const fromOSMCha = api
    .get(`/user-stats/${uid}/`)
    .then((data) => {
      const parsed = osmchaUserStatsSchema.safeParse(data)
      return parsed.success ? parsed.data : {}
    })
    .catch(() => ({}))

  return Promise.all([fromOSMCha, fromOSM]).then(([r1, r2]) => ({
    ...r2,
    ...r1,
  }))
}
