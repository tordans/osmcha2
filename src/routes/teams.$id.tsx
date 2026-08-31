import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { mappingTeamQueryOptions } from '../query/options/account.ts'
import { getAuthToken } from '../stores/auth-store.ts'
import { EditMappingTeam } from '../views/edit_team.tsx'

export const Route = createFileRoute('/teams/$id')({
  params: {
    parse: (raw) => z.object({ id: z.coerce.number().int().positive() }).parse(raw),
    stringify: ({ id }) => ({ id: String(id) }),
  },
  loader: async ({ context, params }) => {
    const token = getAuthToken()
    if (!token) return

    await context.queryClient.ensureQueryData(mappingTeamQueryOptions(params.id))
  },
  component: EditMappingTeam,
})
