import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { setHarmful } from '../../network/changeset.ts'
import { changesetDetailKey, patchChangesetProperties } from '../changesetCache.ts'

interface MarkHarmfulParams {
  changesetId: number
  harmful: boolean | -1
  username: string
  /** When set, PUT body includes `{ tags }`. Use `[]` to clear tags on Looks OK. */
  tags?: number[]
  /** Optimistic tag objects when applying tags with set-harmful / set-good. */
  tagObjects?: Array<{ id: number; name: string }>
}

export function useMarkHarmful() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ changesetId, harmful, tags }: MarkHarmfulParams) =>
      setHarmful(changesetId, harmful, tags),

    onMutate: ({ changesetId, harmful, username, tags, tagObjects }) =>
      patchChangesetProperties(queryClient, changesetId, (properties) => {
        const nextTags = () => {
          if (tags === undefined) return properties.tags
          if (tags.length === 0) return []
          if (tagObjects) return tagObjects
          return tags.map((id) => {
            const known = properties.tags.find((tag) => tag.id === id)
            return known ?? { id, name: String(id) }
          })
        }

        return {
          check_user: harmful === -1 ? null : username,
          checked: harmful !== -1,
          harmful: harmful === -1 ? null : harmful,
          ...(tags !== undefined ? { tags: nextTags() } : {}),
        }
      }),

    onSuccess: (_data, { harmful }) => {
      if (harmful === -1) {
        toast.success('Review cleared')
      } else if (harmful) {
        toast.success('Marked as needs a look')
      } else {
        toast.success('Marked as looks OK')
      }
    },

    onError: (error: Error, _variables, context) => {
      context?.restore()
      toast.error('Failed to update changeset', {
        description: error.message,
      })
    },

    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({
        queryKey: changesetDetailKey(variables.changesetId),
      })
      void queryClient.invalidateQueries({ queryKey: ['changesets', 'page'] })
    },
  })
}
