import { createFileRoute } from '@tanstack/react-router'
import { watchlistQueryOptions } from '../query/options/account.ts'
import { getAuthToken } from '../stores/auth-store.ts'
import { Watchlist } from '../views/watchlist.tsx'

export const Route = createFileRoute('/watchlist')({
  loader: async ({ context }) => {
    const token = getAuthToken()
    if (!token) return

    await context.queryClient.ensureQueryData(watchlistQueryOptions())
  },
  component: Watchlist,
})
