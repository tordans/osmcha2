import { createFileRoute } from '@tanstack/react-router'
import { Authorized } from '../views/authorized.tsx'

export const Route = createFileRoute('/authorized')({
  component: Authorized,
})
