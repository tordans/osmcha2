import { createFileRoute } from '@tanstack/react-router'
import { mappingTeamsQueryOptions, userDetailsQueryOptions } from '../query/options/account.ts'
import { useAuthStore } from '../stores/authStore.ts'
import { MappingTeams } from '../views/teams.tsx'

export const Route = createFileRoute('/teams')({
  loader: async ({ context }) => {
    const token = useAuthStore.getState().token
    if (!token) return

    const userDetails = await context.queryClient.ensureQueryData(userDetailsQueryOptions())
    const username = userDetails?.username
    if (username) {
      await context.queryClient.ensureQueryData(mappingTeamsQueryOptions(username))
    }
  },
  component: MappingTeams,
})
