import { createFileRoute } from '@tanstack/react-router'
import { allAoisQueryOptions } from '../query/options/aoi.ts'
import { useAuthStore } from '../stores/authStore.ts'
import { SavedFilters } from '../views/saved_filters.tsx'

export const Route = createFileRoute('/saved-filters')({
  loader: async ({ context }) => {
    const token = useAuthStore.getState().token
    if (!token) return

    await context.queryClient.ensureQueryData(allAoisQueryOptions())
  },
  component: SavedFilters,
})
