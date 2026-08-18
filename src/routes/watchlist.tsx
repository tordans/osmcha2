import { createFileRoute } from '@tanstack/react-router'
import { watchlistQueryOptions } from '../query/options/account.ts'
import { useAuthStore } from '../stores/authStore.ts'
import { Watchlist } from '../views/watchlist.tsx'

export const Route = createFileRoute('/watchlist')({
  loader: async ({ context }) => {
    const token = useAuthStore.getState().token
    if (!token) return

    await context.queryClient.ensureQueryData(watchlistQueryOptions())
  },
  component: Watchlist,
})
