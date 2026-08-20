import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteFromWatchList, postUserToWatchList } from '../../network/osmcha_watchlist.ts'

interface WatchlistUser {
  username: string
  uid: string
  date?: string
}

export function useAddToWatchlist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ username, uid }: WatchlistUser) =>
      postUserToWatchList({ watchlist_user: { username, uid } }),
    onMutate: async ({ username, uid }) => {
      await queryClient.cancelQueries({ queryKey: ['watchlist'] })
      const previous = queryClient.getQueryData(['watchlist'])

      queryClient.setQueryData(['watchlist'], (old: WatchlistUser[] = []) => [
        ...old,
        { username, uid, date: new Date().toISOString() },
      ])

      return { previous }
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['watchlist'], context.previous)
      }
      toast.error('Failed to add user', { description: error.message })
    },
    onSuccess: (_data, { username, uid }) => {
      toast.success('Added to watchlist', {
        description: `${username} (${uid})`,
      })
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['watchlist'] })
    },
  })
}

export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uid: string) => deleteFromWatchList(uid),
    onMutate: async (uid) => {
      await queryClient.cancelQueries({ queryKey: ['watchlist'] })
      const previous = queryClient.getQueryData(['watchlist'])

      queryClient.setQueryData(['watchlist'], (old: WatchlistUser[] = []) =>
        old.filter((u) => u.uid !== uid),
      )

      return { previous }
    },
    onError: (error: Error, _uid, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['watchlist'], context.previous)
      }
      toast.error('Failed to remove user', { description: error.message })
    },
    onSuccess: (_data) => {
      toast.success('Removed from watchlist')
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['watchlist'] })
    },
  })
}
