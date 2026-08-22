import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { exclusiveSiblingsOf } from '../../components/changeset/reviewPresentation.ts'
import { setTag } from '../../network/changeset.ts'

interface SetTagParams {
  changesetId: number
  tag: { value: number; label: string }
  remove: boolean
}

export function useSetTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ changesetId, tag, remove }: SetTagParams) => {
      if (!remove) {
        const siblings = exclusiveSiblingsOf(tag.value)
        for (const siblingId of siblings) {
          try {
            await setTag(changesetId, { value: siblingId, label: String(siblingId) }, true)
          } catch {
            // Sibling may not be present; ignore.
          }
        }
      }
      return setTag(changesetId, tag, remove)
    },

    onMutate: async ({ changesetId, tag, remove }) => {
      await queryClient.cancelQueries({ queryKey: ['changeset', changesetId] })

      const previous = queryClient.getQueryData(['changeset', changesetId])

      const updateTags = (existingTags: any[]) => {
        if (remove) {
          return existingTags.filter((t: any) => t.id !== tag.value)
        }
        const siblings = new Set(exclusiveSiblingsOf(tag.value))
        const withoutSiblings = existingTags.filter((t: any) => !siblings.has(t.id))
        if (withoutSiblings.some((t: any) => t.id === tag.value)) return withoutSiblings
        return [...withoutSiblings, { id: tag.value, name: tag.label }]
      }

      queryClient.setQueryData(['changeset', changesetId], (old: any) => {
        if (!old) return old

        const checked = old.properties?.checked
        if (!checked) {
          throw new Error('Only allowed on checked changesets')
        }

        return {
          ...old,
          properties: {
            ...old.properties,
            tags: updateTags(old.properties?.tags || []),
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
                tags: updateTags(f.properties?.tags || []),
              },
            }
          }
          return f
        })
        return { ...old, features }
      })

      return { previous, changesetId }
    },

    onSuccess: (_data, { tag, remove }) => {
      toast.success(remove ? 'Tag removed' : 'Tag added', {
        description: tag.label,
      })
    },

    onError: (error: Error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['changeset', context.changesetId], context.previous)
      }
      toast.error('Failed to update tags', {
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
