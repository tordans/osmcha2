import { createFileRoute } from '@tanstack/react-router'
import { User } from '../views/user.tsx'

export const Route = createFileRoute('/user')({
  component: User,
})
