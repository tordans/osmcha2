import { createFileRoute, notFound } from '@tanstack/react-router'
import { z } from 'zod'
import { isMissingCredentialsError } from '../network/request.ts'
import {
  changesetDiscussionQueryOptions,
  changesetMapQueryOptions,
  changesetQueryOptions,
} from '../query/options/changeset.ts'
import { osmchaSearchSchema } from '../routing/searchSchemas.ts'
import { getAuthToken } from '../stores/auth-store.ts'
import { Changeset } from '../views/changeset.tsx'
import {
  ChangesetLoadError,
  ChangesetNotFound,
  ChangesetPending,
} from '../views/changesetLoadStates.tsx'

export const Route = createFileRoute('/changesets/$id')({
  params: {
    parse: (raw) => z.object({ id: z.coerce.number().int().positive() }).parse(raw),
    stringify: ({ id }) => ({ id: String(id) }),
  },
  validateSearch: osmchaSearchSchema,
  loader: async ({ context, params }) => {
    if (!getAuthToken()) return

    try {
      await context.queryClient.ensureQueryData(changesetQueryOptions(params.id))
    } catch (error) {
      if (error instanceof Error && /not found/i.test(error.message)) {
        throw notFound()
      }
      if (isMissingCredentialsError(error)) {
        context.queryClient.removeQueries({ queryKey: changesetQueryOptions(params.id).queryKey })
        return
      }
      throw error
    }

    await Promise.all([
      context.queryClient.ensureQueryData(changesetMapQueryOptions(params.id)).catch(() => {
        // Review pane still loads; CMap shows retry UI when the adiff is missing.
      }),
      context.queryClient.ensureQueryData(changesetDiscussionQueryOptions(params.id)).catch(() => {
        // Comment count stays empty until the Discussion tab retries.
      }),
    ])
  },
  pendingComponent: ChangesetPending,
  notFoundComponent: ChangesetNotFound,
  errorComponent: ChangesetLoadError,
  component: Changeset,
})
