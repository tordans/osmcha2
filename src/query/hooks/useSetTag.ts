import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { exclusiveSiblingsOf } from '../../components/changeset/reviewPresentation.ts'
import { setTag, type ChangesetFeature, type ChangesetProperties } from '../../network/changeset.ts'
import { ApiError } from '../../network/request.ts'
import { changesetDetailKey, patchChangesetProperties } from '../changesetCache.ts'

interface SetTagParams {
  changesetId: number
  tag: { value: number; label: string }
  remove: boolean
}

type Tags = ChangesetProperties['tags']

/** The tags after adding or removing `tag`; adding drops the tags that exclude it. */
function updatedTags(existingTags: Tags, tag: SetTagParams['tag'], remove: boolean): Tags {
  if (remove) {
    return existingTags.filter((t) => t.id !== tag.value)
  }
  const siblings = new Set<string | number | undefined>(exclusiveSiblingsOf(tag.value))
  const withoutSiblings = existingTags.filter((t) => !siblings.has(t.id))
  if (withoutSiblings.some((t) => t.id === tag.value)) return withoutSiblings
  return [...withoutSiblings, { id: tag.value, name: tag.label }]
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
          } catch (error) {
            // The sibling is not on the changeset: nothing to remove.
            if (!(error instanceof ApiError && error.status === 404)) throw error
          }
        }
      }
      return setTag(changesetId, tag, remove)
    },

    onMutate: async ({ changesetId, tag, remove }) => {
      const detail = queryClient.getQueryData<ChangesetFeature>(changesetDetailKey(changesetId))
      if (detail && !detail.properties.checked) {
        throw new Error('Only allowed on checked changesets')
      }

      return patchChangesetProperties(queryClient, changesetId, (properties) => ({
        tags: updatedTags(properties.tags, tag, remove),
      }))
    },

    onSuccess: (_data, { tag, remove }) => {
      toast.success(remove ? 'Tag removed' : 'Tag added', {
        description: tag.label,
      })
    },

    onError: (error: Error, _variables, context) => {
      context?.restore()
      toast.error('Failed to update tags', {
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
