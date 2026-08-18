import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { mappingTeamQueryOptions } from '../query/options/account.ts'
import { useAuthStore } from '../stores/authStore.ts'
import { EditMappingTeam } from '../views/edit_team.tsx'

export const Route = createFileRoute('/teams/$id')({
  params: {
    parse: (raw) => z.object({ id: z.coerce.number().int().positive() }).parse(raw),
    stringify: ({ id }) => ({ id: String(id) }),
  },
  loader: async ({ context, params }) => {
    const token = useAuthStore.getState().token
    if (!token) return

    await context.queryClient.ensureQueryData(mappingTeamQueryOptions(params.id))
  },
  component: EditMappingTeam,
})
