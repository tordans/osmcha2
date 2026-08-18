import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { Changeset } from '../views/changeset.tsx'

export const Route = createFileRoute('/changesets/$id')({
  params: {
    parse: (raw) => z.object({ id: z.coerce.number().int().positive() }).parse(raw),
    stringify: ({ id }) => ({ id: String(id) }),
  },
  validateSearch: z.object({
    map: z.string().optional(),
  }),
  component: Changeset,
})
