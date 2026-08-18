import { createFileRoute } from '@tanstack/react-router'
import { Watchlist } from '../views/watchlist.tsx'

export const Route = createFileRoute('/watchlist')({
  component: Watchlist,
})
