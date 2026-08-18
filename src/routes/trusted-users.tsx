import { createFileRoute } from '@tanstack/react-router'
import { userDetailsQueryOptions } from '../query/options/account.ts'
import { useAuthStore } from '../stores/authStore.ts'
import { TrustedUsers } from '../views/trusted_users.tsx'

export const Route = createFileRoute('/trusted-users')({
  loader: async ({ context }) => {
    const token = useAuthStore.getState().token
    if (!token) return

    await context.queryClient.ensureQueryData(userDetailsQueryOptions())
  },
  component: TrustedUsers,
})
