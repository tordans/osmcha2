import { createFileRoute } from '@tanstack/react-router'
import { userDetailsQueryOptions } from '../query/options/account.ts'
import { getAuthToken } from '../stores/auth-store.ts'
import { User } from '../views/user.tsx'

export const Route = createFileRoute('/user')({
  loader: async ({ context }) => {
    const token = getAuthToken()
    if (!token) return

    await context.queryClient.ensureQueryData(userDetailsQueryOptions())
  },
  component: User,
})
