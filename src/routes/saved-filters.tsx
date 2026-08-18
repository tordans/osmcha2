import { createFileRoute } from '@tanstack/react-router'
import { SavedFilters } from '../views/saved_filters.tsx'

export const Route = createFileRoute('/saved-filters')({
  component: SavedFilters,
})
