import { createFileRoute } from '@tanstack/react-router'
import { userDetailsQueryOptions } from '../query/options/account.ts'
import { useAuthStore } from '../stores/authStore.ts'
import { User } from '../views/user.tsx'

export const Route = createFileRoute('/user')({
  loader: async ({ context }) => {
    const token = useAuthStore.getState().token
    if (!token) return

    await context.queryClient.ensureQueryData(userDetailsQueryOptions())
  },
  component: User,
})
