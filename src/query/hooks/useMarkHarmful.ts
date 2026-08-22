import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { setHarmful } from '../../network/changeset.ts'

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

    onMutate: async ({ changesetId, harmful, username, tags, tagObjects }) => {
      await queryClient.cancelQueries({ queryKey: ['changeset', changesetId] })

      const previous = queryClient.getQueryData(['changeset', changesetId])

      const nextTags = (existing: Array<{ id?: number; name: string }> = []) => {
        if (tags === undefined) return existing
        if (tags.length === 0) return []
        if (tagObjects) return tagObjects
        return tags.map((id) => {
          const known = existing.find((tag) => tag.id === id)
          return known ?? { id, name: String(id) }
        })
      }

      queryClient.setQueryData(['changeset', changesetId], (old: any) => {
        if (!old) return old
        return {
          ...old,
          properties: {
            ...old.properties,
            check_user: harmful === -1 ? null : username,
            checked: harmful !== -1,
            harmful: harmful === -1 ? null : harmful,
            ...(tags !== undefined ? { tags: nextTags(old.properties?.tags) } : {}),
          },
        }
      })

      queryClient.setQueriesData({ queryKey: ['changesets', 'page'] }, (old: any) => {
        if (!old?.features) return old
        const features = old.features.map((f: any) => {
          if (f.id === changesetId) {
            return {
              ...f,
              properties: {
                ...f.properties,
                check_user: harmful === -1 ? null : username,
                checked: harmful !== -1,
                harmful: harmful === -1 ? null : harmful,
                ...(tags !== undefined ? { tags: nextTags(f.properties?.tags) } : {}),
              },
            }
          }
          return f
        })
        return { ...old, features }
      })

      return { previous, changesetId }
    },

    onSuccess: (_data, { harmful }) => {
      if (harmful === -1) {
        toast.success('Review cleared')
      } else if (harmful) {
        toast.success('Marked as needs a look')
      } else {
        toast.success('Marked as looks OK')
      }
    },

    onError: (error: Error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['changeset', context.changesetId], context.previous)
      }
      toast.error('Failed to update changeset', {
        description: error.message,
      })
    },

    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['changeset', variables.changesetId],
      })
      void queryClient.invalidateQueries({ queryKey: ['changesets', 'page'] })
    },
  })
}
