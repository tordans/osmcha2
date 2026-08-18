import { createFileRoute } from '@tanstack/react-router'
import { TrustedUsers } from '../views/trusted_users.tsx'

export const Route = createFileRoute('/trusted-users')({
  component: TrustedUsers,
})
