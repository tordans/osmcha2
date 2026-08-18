import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { EditMappingTeam } from '../views/edit_team.tsx'

export const Route = createFileRoute('/teams/$id')({
  params: {
    parse: (raw) => z.object({ id: z.coerce.number().int().positive() }).parse(raw),
    stringify: ({ id }) => ({ id: String(id) }),
  },
  component: EditMappingTeam,
})
