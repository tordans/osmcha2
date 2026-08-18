import { createFileRoute } from '@tanstack/react-router'
import { Home } from '../views/home.tsx'

export const Route = createFileRoute('/')({
  component: Home,
})
