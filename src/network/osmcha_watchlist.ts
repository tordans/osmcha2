import { z } from 'zod'
import { api } from './request.ts'

const watchlistUserSchema = z.object({
  username: z.string(),
  uid: z.union([z.string(), z.number()]),
  date: z.string().optional(),
})

export type WatchlistUser = z.infer<typeof watchlistUserSchema>

export function fetchWatchList(): Promise<WatchlistUser[]> {
  return api.get('/blacklisted-users/').then((data) => z.array(watchlistUserSchema).parse(data))
}

export function deleteFromWatchList(uid: string): Promise<any> {
  return api.delete(`/blacklisted-users/${uid}/`)
}

export function postUserToWatchList(data: any): Promise<any> {
  return api.post('/blacklisted-users/', {
    username: data.watchlist_user.username,
    uid: data.watchlist_user.uid,
  })
}
