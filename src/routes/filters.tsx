import { createFileRoute } from '@tanstack/react-router'
import { Filters } from '../views/filters.tsx'

export const Route = createFileRoute('/filters')({
  component: Filters,
})
