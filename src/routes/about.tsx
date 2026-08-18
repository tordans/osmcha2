import { createFileRoute } from '@tanstack/react-router'
import { About } from '../views/about.tsx'

export const Route = createFileRoute('/about')({
  component: About,
})
